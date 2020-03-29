## Jovo Resumer Plugin

>NB: this project is a WIP. We are actively working towards rolling up, testing, and providing examples!

This plugin makes it simple to integrate conversational memory into a Jovo app. It provides an easy to use API
that manages the data required to pause, resume, and switch between multi-step linear or non-linear conversations.


## Install

>`npm i jovo-plugin-resume --save`

## API

The plugin adds a new object to the Jovo object, Resumer.
It can be accessed in your handler function with
`this.$resumer`
This object is automatically serialized and deserialized into the jovo user data object with each request, and has the following exposed methods:

### switchTo(conversationName: string, startIntent: string)

switchTo acts like an intelligent toStateIntent.
For example:

```
startFooHandler() {
    if (someConditionThatStartsFoo) {
        this.$resumer.switchTo("FooConversation", "FooIntent");
    }
},
FooConversation: {
    FooIntent() {
        this.followUpState("YesNoState").ask("Welcome to the Foo conversation! Say Yes or No!");
    },

    YesNoState: {
        YesIntent() {
            ...
        },
        NoIntent() {
            ...
        }
    },
    ...
}
```
When FooConversation is first started, the switchTo is functionally identical to
`toStateIntent("FooConversation", "FooIntent")`
If the user starts FooConversation, then answers yes to the intial question, they are in the YesNoState, part of
FooConversation. Now if the user closes out of the app, and hits the startFooHandler again, switchTo will not bring them
to the FooIntent handler, but will bring them to the YesIntent handler that they left off in. All requests
(accross any session) are now automatically saved as a marker for the current conversation.
This can be controlled with the following methods:

### endCurrent()
Signals that the conversation currently in progress has reached its end.

### pauseCurrent()
Call this to preserve the progress of the current conversation, but stop interacting with.

### ignore()
Tells the resumer to not update the conversation with the current request. Use this for intents that do not
progress the conversation, such as Fallback, Unhandled, Help, etc...


### Handling a Resume
The way to determine if handler code is running under the context of a normal request, or from a resume,
the field actionData will either be set or not set. So when a resume happens $resumer.actionData will be an object
with the following fields:

```
comingFrom: ConversationStatus,
resumingInto: ConversationStatus
```

where ConversationStatus is an object with the following fields:

```
name: string, // the conversation name, empty string if not in a conversation
// Important information about the last request in this conversation
intent: string,
state: string,
timestamp: string,
slots: Object
```

So to write a handler function that can gracefully be resumed into:
```
handler() {
    let resumeData = this.$resumer.actionData;
    if (resumeData) {
        // Handle this intent in the context of a resume
        console.log(`This conversation is being resumed from ${resumeData.comingFrom.name}`);
        console.log(`This conversation was left at this point at ${resumeData.resumingInto.timestamp}`);
    } else {
        // Handle this intent like normal
    }
}
```


### Code Examples
```
app.setHandler({

    ConversationStarter() {
        let slots = this.$inputs;
        // Resumer maintains input history, so one intent handler
        // is able to start multiple conversations
        if (slots.foo.value) {
            this.$resumer.switchTo("foo", "fooStart");
        } else if (slots.bar.value) {
            this.$resumer.switchTo("bar", "barStart");
        }
    },

    foo: {
        fooStart() {
            this.followUpState("Foo.Question").ask("Say yes or no");
        },
        Question: {
            YesIntent() {
                this.followUpState("Question2").ask("Say your name");
            },

            NoIntent() {
                this.$resumer.endCurrent(); // This intent means that the foo conversation is done
                this.removeState().ask("Start a new Conversation!");
            }
        }
    },
    Question2: {
        MyNameIsIntent() {
            // States don't have to be within the foo state to be part of the conversation
            this.$resumer.ignore(); // However we don't want this intent to be saved to foo
            this.removeState().ask();
        },

        NoIntent() {
            let resumeData = this.$resumer.actionData;
            if (resumeData) {
                // The user got to this point in foo previously
                // They have restarted it, and we want to ask them again in maybe a gentler, different way
                this.ask(
                "Hey, last time we talked I asked you for your name, but you didnt' want to tell me it." +
                " Do you want to tell me it now?")
            } else {
                // The user declined entering their name for the first time
                // We want to remember that they are at the point in foo where their name is asked
                // but we want to move on to something else for now
                this.$resumer.pauseCurrent();
                this.removeState().ask("That's ok, we can try again later!");
            }

        }
    }

    bar: {
        barStart() {
            this.followUpState("bar.StartFoo").ask("Do you want to start the foo conversation?");
        },

        startFoo: {
            YesIntent() {
                // saves that we have started the bar conversation
                // but switching the focus over to foo
                this.$resumer.switchTo("foo", "startFoo");
            }
        }
    }
})
```
