import {defineRouting} from 'next-intl/routing';
import { Local } from '../types/types';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: [Local.EN, Local.FR, Local.AR],
 
  // Used when no locale matches
  defaultLocale: Local.EN,


});