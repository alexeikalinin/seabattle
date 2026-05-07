import '@/types/AirConsoleTypes';
import { ControllerUI } from './ControllerUI';

const ac = new AirConsole({ orientation: 'portrait' });
const ui = new ControllerUI(ac);

ac.onReady = () => ui.init();
ac.onMessage = (_deviceId: number, data: unknown) => ui.handleScreenMessage(data);
