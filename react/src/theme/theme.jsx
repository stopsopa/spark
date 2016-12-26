/**
 * NB: If you update this file, please also update `docs/src/app/customization/Themes.js`
 */

import {
    brown600, brown700,
    yellow900,
    brown200, grey300, brown500, grey500,
    white, darkBlack, fullBlack,
// } from '../colors';
} from 'material-ui/styles/colors';
import {fade} from 'material-ui/utils/colorManipulator';
import spacing from 'material-ui/styles/spacing';

/**
 *  Light Theme is the default theme used in material-ui. It is guaranteed to
 *  have all theme variables needed for every component. Variables not defined
 *  in a custom theme will default to these values.
 */
export default {
  spacing: spacing,
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: brown600,
    primary2Color: brown700,
    primary3Color: brown500,
    accent1Color: yellow900,
    accent2Color: brown200,
    accent3Color: grey500,
    textColor: darkBlack,
    secondaryTextColor: fade(darkBlack, 0.54),
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    disabledColor: fade(darkBlack, 0.3),
    pickerHeaderColor: brown600,
    clockCircleColor: fade(darkBlack, 0.07),
    shadowColor: fullBlack,
  },
};