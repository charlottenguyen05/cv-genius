import { Font } from '@react-pdf/renderer';
import path from 'path';

// Use a serif font that resembles LaTeX's Computer Modern
// Option: CMU Serif (open source, exact LaTeX font), or fallback to Times New Roman
Font.register({
    family: 'CMU Serif',
    fonts: [
        { src: path.join(process.cwd(), 'public', 'fonts', 'cmunrm.ttf') },                          // Regular
        { src: path.join(process.cwd(), 'public', 'fonts', 'cmunbx.ttf'), fontWeight: 'bold' },       // Bold
        { src: path.join(process.cwd(), 'public', 'fonts', 'cmunti.ttf'), fontStyle: 'italic' },      // Italic
        { src: path.join(process.cwd(), 'public', 'fonts', 'cmunbi.ttf'), fontWeight: 'bold', fontStyle: 'italic' }, // Bold Italic
    ],
});
