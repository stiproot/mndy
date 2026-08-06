const moment = require("moment");

export const now = () => moment().utc().format();

export const toLocale = (timestamp: string): string => moment.utc(timestamp).local().format('DD/MM/YYYY');

export const importStamp = (): string => `mndy-WIImport-${moment.utc(now()).local().format('DD-MM-YYYY')}`;