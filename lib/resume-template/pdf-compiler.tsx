import { renderToBuffer } from '@react-pdf/renderer';
import { JakeResumeDocument } from './jake-resume';
import { CVFormData } from '@/types';
import './fonts'; // Register fonts

export async function generatePDFBuffer(cvData: CVFormData): Promise<Buffer> {
    const buffer = await renderToBuffer(
        <JakeResumeDocument cvData={ cvData } />
  );
    return Buffer.from(buffer);
}
