// load configuration from static/config.json
// ~~simple just key-value pair, and nested object into "parent.child.value", just a flat object~~
// ~~called like config('key') or config('parent.child.key')~~
// think it is possible to have ts validation on a imported json config file so just parse the json file and export it as a module
// if config is not found, throw error

import type StaticConfig from '~/project/static/config.json';
import { LoadJsonFile } from './files';

let config = LoadJsonFile('static/config.json');

$BROWSER: {
  config = await config;
}

export default config as typeof StaticConfig;
