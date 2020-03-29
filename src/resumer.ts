import { Jovo } from 'jovo-core';
import get from 'lodash.get';
import { ConversationStatus, CURRENT_KEY, ResumeActionData, ResumeData, STATUS_KEY } from './interfaces';

export class JovoResumer {

    public actionHasBeenTaken: boolean = false;
    private previousSwitch: any;

    private incomingRequest: ConversationStatus = {
        intent: '',
        name: '',
        slots: {},
        state: '',
        timestamp: '',
    };

    private conversationStatus: ConversationStatus[] | undefined;
    private currentConversation: string | null;
    private resumeActionData?: ResumeActionData;
    private jovo: Jovo;

    constructor(previousTracker: ResumeData, jovo: Jovo) {
        this.conversationStatus = get(previousTracker, STATUS_KEY, []);
        this.currentConversation = get(previousTracker, CURRENT_KEY, null);
        this.jovo = jovo;

        this.convertNullsToEmptyStrings();
    }

    public switchTo(conversation: string, startIntent?: string) {
        const status = this.getStatusFor(conversation);
        this.currentConversation = conversation;

        let toState = conversation;
        let toIntent = startIntent || 'entryPoint';

        if (status) {
            this.jovo!.$inputs = status.slots;

            this.resumeActionData = {
                comingFrom: this.incomingRequest,
                resumingInto: status
            };

            const alreadySwitched = this.previousSwitch
                && this.previousSwitch.toState === toState
                && this.previousSwitch.toIntent === toIntent;
            const incomingRequestSameAsSwitchDest = this.incomingRequest
                && status.intent === this.incomingRequest.intent
                && status.state === this.incomingRequest.state

            if (!alreadySwitched && !incomingRequestSameAsSwitchDest) {
                toState = status.state;
                toIntent = status.intent;
            }
        }

        this.previousSwitch = {
            toIntent,
            toState
        };

        this.jovo.toStateIntent(toState, toIntent);
    }

    // Todo: support an array of resumeActionData for multiple open conversations
    // public setResumeActionData() {
    //     this.resumeActionData = {
    //         comingFrom: this.incomingRequest,
    //         resumingInto: status
    //     }
    // }

    public ignore() {
        this.actionHasBeenTaken = true;
    }

    public pauseCurrent() {
        this.actionHasBeenTaken = true;
        this.currentConversation = null;
    }

    public endCurrent() {
        this.actionHasBeenTaken = true;
        this.nullifyCurrentConv();
    }

    public progressCurrent(incomingRequest: ConversationStatus) {
        if (this.currentConversation) {
            if (!incomingRequest.intent
                || incomingRequest.intent === 'Fallback'
                || incomingRequest.intent === 'END'
                || incomingRequest.intent === 'SessionEndedRequest') {
                return;
            }

            incomingRequest.name = this.currentConversation;
            this.updateCurrentConv(incomingRequest);
        }
    }

    public wipeData() {
        this.actionHasBeenTaken = true;
        this.currentConversation = null;
        this.conversationStatus = [];
        this.previousSwitch = null;
    }

    public setIncomingRequest(jovo: Jovo): void {
        if (!jovo) { return };

        this.incomingRequest = {
            intent: jovo.getMappedIntentName() || '',
            name: '',
            slots: jovo.$inputs || {},
            state: (jovo.$request!.getState() || jovo.$session.$data._JOVO_STATE_) || '',
            timestamp: jovo.$request!.getTimestamp() || '',
        };

        // let intent = jovo.getMappedIntentName() || '';
        // let state = (jovo.$request!.getState() || jovo.$session.$data._JOVO_STATE_) || '';
        // let timestamp = jovo.$request!.getTimestamp() || '';
        // let slots = jovo.$inputs || {};

        // try {
        //     intent = jovo.getMappedIntentName() || '';
        // } catch(e) {
        //     intent = '';
        //     console.log(e);
        // }

        // try {
        //     state = (jovo.$request!.getState() || jovo.$session.$data._JOVO_STATE_) || '';
        // } catch(e) {
        //     state = ''
        //     console.log(e);
        // }

        // try {
        //     timestamp = jovo.$request!.getTimestamp();
        // } catch(e) {
        //     console.log(e);
        // }

        // try {
        //     slots = jovo.$inputs;
        // } catch(e) {
        //     console.log(e);
        // }

        // this.incomingRequest = {
        //     intent, state, timestamp, slots, name: ''
        // };
    }

    private getStatusFor(convName: string): ConversationStatus | undefined {
        if (this.conversationStatus && this.conversationStatus.length > 0) {
            return this.conversationStatus.find(conv => conv.name === convName);
        } else {
            return undefined
        };
    }

    private nullifyCurrentConv() {
        if (this.conversationStatus && this.conversationStatus.length > 0) {
            const convName = this.currentConversation;
            this.conversationStatus = this.conversationStatus.filter(conv => conv.name !== convName);
            this.currentConversation = null;
        }
    }

    private updateCurrentConv(newStatus: ConversationStatus) {
        if (!this.conversationStatus) { return };

        const exists = this.conversationStatus!.find(status => status.name === this.currentConversation);
        if (exists) {
            this.conversationStatus = this.conversationStatus!.map(status => status.name === this.currentConversation ? newStatus : status);
        } else {
            this.conversationStatus.push(newStatus);
        }
    }

    private convertNullsToEmptyStrings() {
        if (!this.conversationStatus) { return };
        this.conversationStatus = this.conversationStatus.map(conv => {
            if (conv.state === null) { conv.state = '' };
            return conv;
        });
    }

    get hasMultipleOpenConversations() {
        return this.conversationStatus && this.conversationStatus.length > 1;
    }

    get actionData(): ResumeActionData | undefined {
        if (this.resumeActionData) {
            return this.resumeActionData
        } else { return undefined };
    }

    get asResumeData(): ResumeData {
        return {
            [STATUS_KEY]: this.conversationStatus,
            [CURRENT_KEY]: this.currentConversation
        };
    }

    get status(): ConversationStatus[] {
        return this.conversationStatus!;
    }

    get currentConvStatus(): ConversationStatus | undefined {
        return this.getStatusFor(this.currentConversation!);
    }

    get originalRequest() {
        return this.incomingRequest;
    }
}
