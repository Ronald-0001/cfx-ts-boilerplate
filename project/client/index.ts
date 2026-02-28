import Config from '@common/utils/config';
import { Greetings } from '@common/index';

Greetings();

if (Config.Debug?.enabled) {
  onNet(`${GetCurrentResourceName()}:openNui`, () => {
    SetNuiFocus(true, true);

    SendNUIMessage({
      action: 'setVisible',
      data: {
        visible: true,
      },
    });
  });

  RegisterNuiCallback('exit', (data: null, cb: (data: unknown) => void) => {
    SetNuiFocus(false, false);
    cb({});
  });
}
