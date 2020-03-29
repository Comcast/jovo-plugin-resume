import { JovoResumerConfig } from './interfaces';
import { JovoResumer } from './resumer';
export { Resumer } from './middleware';

declare module 'jovo-core/dist/src/Interfaces' {
    export interface ExtensiblePluginConfigs extends JovoResumerConfig {}
}

declare module 'jovo-core/dist/src/' {
    export interface Jovo {
        $resumer: JovoResumer;
    }
    export interface User {
        $data: { [key: string]: any }; // eslint-disable-line
    }
}
