import { BaseApp, HandleRequest, Plugin } from 'jovo-core';
import get from 'lodash.get';
import set from 'lodash.set';
import { JovoResumerConfig, ResumeData } from './interfaces';
import { JovoResumer } from './resumer';

export class Resumer implements Plugin {
    public config: JovoResumerConfig = {
        resumeDataKey: 'resumeData',
    };

    constructor(config?: JovoResumerConfig) {
        if (config) {
            this.config = config;
        }
    }

    public install(app: BaseApp): void {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        app.middleware('router')!.use(this.getResumer.bind(this));
        app.middleware('handler')!.use(this.saveResumer.bind(this));
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
    }

    public getResumer(handleRequest: HandleRequest): void {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        const jovo: HandleRequest['jovo'] = handleRequest.jovo!;
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
        const resumeData: ResumeData = get(jovo.$user.$data, this.config.resumeDataKey);
        const resumer: JovoResumer = new JovoResumer(resumeData, jovo);
        jovo.$resumer = resumer;

        const currentConv = resumer.currentConvStatus;
        const incomingIntent = jovo.getIntentName();
        resumer.setIncomingRequest(jovo);

        // If they are launching the app and previously closed the app while in a conversation
        if (
            currentConv &&
            (!incomingIntent ||
                incomingIntent.toLowerCase() === 'default welcome intent' ||
                incomingIntent.toLowerCase() === 'launch')
        ) {
            if (resumer.hasMultipleOpenConversations) {
                // populate resume data but don't automatically switch
            }

            jovo.$resumer.switchTo(currentConv.name, currentConv.intent);
        }
    }

    public saveResumer(handleRequest: HandleRequest): void {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        const jovo: HandleRequest['jovo'] = handleRequest.jovo!;
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
        const resumer: JovoResumer = jovo.$resumer;

        if (!resumer.actionHasBeenTaken) {
            resumer.progressCurrent(resumer.originalRequest);
        }

        set(jovo.$user.$data, this.config.resumeDataKey, resumer.asResumeData);
    }
}
