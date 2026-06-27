import {defineRouting} from 'next-intl/routing';
import { Local } from '../types/types';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: [Local.EN],
 
  // Used when no locale matches
  defaultLocale: Local.EN,


});