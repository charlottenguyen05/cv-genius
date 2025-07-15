import { CVFormData, Experience, Education, Skill, Language } from "@/types/index" // Assuming your types are in a file like 'lib/types.ts'

// --- UNIQUE ID GENERATOR ---
// Simple unique ID generator using timestamp and random number
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36
  const randomPart = Math.random().toString(36).slice(2, 9); // Get random string
  return `${timestamp}-${randomPart}`;
}

// --- REGEX DEFINITIONS ---

// Regex for personal information
const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const REGEX_PHONE = /(?:(?:\+|00)[1-9]\d{0,3}[\s.-]?)?(?:\(0\)?[\s.-]?)?[1-9](?:[\s.-]?\d){6,14}/; // More universal
const REGEX_LINKEDIN = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/;
const REGEX_WEBSITE = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?)/;

// Regex for section headers. These are crucial for splitting the document.
// The 'i' flag makes them case-insensitive.
const REGEX_HEADING_EXPERIENCE = /(?:exp[eé]riences?|experience|work|employment)(?:\s+(?:professionnelles?|history))?/i;
const REGEX_HEADING_EDUCATION = /(?:formation|education|studies|academic)/i;
const REGEX_HEADING_SKILLS = /(?:comp[eé]tences|skills|abilities|expertise)/i;
const REGEX_HEADING_LANGUAGES = /(?:langues|languages|linguistic)/i;

// A general date regex to capture start and end dates.
// It looks for patterns like "Mois AAAA - Mois AAAA" or "AAAA - AAAA" or "Mois AAAA - Aujourd'hui"
const REGEX_DATE_RANGE = /(\d{4}|(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Fév|Mar|Avr|Mai|Juin|Juil|Aoû|Sep|Oct|Nov|Déc)\.?\s+\d{4})\s*à|au|–|-\s*(\d{4}|(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Fév|Mar|Avr|Mai|Juin|Juil|Aoû|Sep|Oct|Nov|Déc)\.?\s+\d{4}|Aujourd'hui|Présent|En cours|Current)/i;


// --- HELPER FUNCTIONS ---

/* *
 * Finds the start and end index of each major section in the CV text and return their content {experience : "start of exp ... end of exp"}
 * @param text The full text of the CV.
 * @returns An object mapping section names to their text content.
 */
function splitTextIntoSections(text: string): Record<string, string> {
    const sections: Record<string, { regex: RegExp, index: number }> = {
        experience: { regex: REGEX_HEADING_EXPERIENCE, index: -1 },
        education: { regex: REGEX_HEADING_EDUCATION, index: -1 },
        skills: { regex: REGEX_HEADING_SKILLS, index: -1 },
        languages: { regex: REGEX_HEADING_LANGUAGES, index: -1 },
    };

    // Find the starting index of each section heading
    for (const key in sections) {
        const match = text.match(sections[key].regex);
        if (match && typeof match.index === 'number') {
            sections[key].index = match.index;
        }
    }

    // Sort sections by their appearance in the text
    const sortedSections = Object.entries(sections)
        .filter(([, data]) => data.index !== -1)  // Keep only the section that be found in the CV
        .sort(([, a], [, b]) => a.index - b.index);  // Sort the remaining sections by starting index

    const extractedContent: Record<string, string> = {};
    let lastIndex = 0;

    // The text before the first heading is considered personal info
    if (sortedSections.length > 0) {
        extractedContent.personalInfo = text.substring(0, sortedSections[0][1].index);
    } else {
        // If no sections found, assume the whole text is personal info
        extractedContent.personalInfo = text;
    }

    // Slice the text for each section
    for (let i = 0; i < sortedSections.length; i++) {
        const [key, data] = sortedSections[i];
        const startIndex = data.index;
        const endIndex = i + 1 < sortedSections.length ? sortedSections[i + 1][1].index : text.length;
        extractedContent[key] = text.substring(startIndex, endIndex);
    }

    return extractedContent;
}


/* *
 * Parses the personal information from a text block.
 * @param text The text block containing personal info.
 * @returns A Partial<PersonalInfo> object.
 */
function parsePersonalInfo(text: string) {
    const emailMatch = text.match(REGEX_EMAIL);
    const phoneMatch = text.match(REGEX_PHONE);
    const linkedinMatch = text.match(REGEX_LINKEDIN);
    const websiteMatch = text.match(REGEX_WEBSITE);
    
    // A simple heuristic for name: the first line of the CV.
    // This can be improved, but it's a reasonable starting point.
    const name = text.split('\n')[0].trim();

    return {
        name: name,
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
        website: websiteMatch ? websiteMatch[0] : undefined,
    };
}

/* *
 * Parses work experiences from a text block.
 * @param text The text block for the "Experience" section.
 * @returns An array of Partial<Experience> objects.
 */
function parseExperiences(text: string): Partial<Experience>[] {
    const experiences: Partial<Experience>[] = [];
    // Split the section into individual job entries. A common pattern is that a new job starts with a date.
    // We use a positive lookahead `(?=...)` to split the text while keeping the delimiter (the date range).
    const entries = text.split(/(?=((?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Fév|Mar|Avr|Mai|Juin|Juil|Aoû|Sep|Oct|Nov|Déc)\.?\s+\d{4}|\d{4}))/i).filter(entry => entry.trim().length > 10);

    entries.forEach(entry => {
        const lines = entry.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return;

        const dateMatch = entry.match(REGEX_DATE_RANGE);
        const startDate = dateMatch ? dateMatch[1] : 'Unknown';
        const endDate = dateMatch ? dateMatch[2] : undefined;

        // Heuristic: Position is often the first line after the date. Company is the next.
        // This is a simplification and might need adjustment for different CV layouts.
        const position = lines[0].replace(REGEX_DATE_RANGE, '').trim();
        const companyAndLocation = lines[1] ? lines[1].split(/[-–@|]/) : ['Unknown'];
        const company = companyAndLocation[0].trim();
        const location = companyAndLocation[1] ? companyAndLocation[1].trim() : undefined;
        
        const description = lines.slice(2).join('\n').trim();

        experiences.push({
            id: generateUniqueId(),
            position,
            company,
            location,
            startDate,
            endDate,
            description,
            isCurrentPosition: /aujourd'hui|présent|en cours|current/i.test(endDate || ''),
        });
    });

    return experiences;
}

/* *
 * Parses education history from a text block.
 * @param text The text block for the "Education" section.
 * @returns An array of Partial<Education> objects.
 */
function parseEducation(text: string): Partial<Education>[] {
    // The structure is often similar to experience, so we can reuse a similar logic.
    const educations: Partial<Education>[] = [];
    const entries = text.split(/(?=((?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Fév|Mar|Avr|Mai|Juin|Juil|Aoû|Sep|Oct|Nov|Déc)\.?\s+\d{4}|\d{4}))/i).filter(entry => entry.trim().length > 10);

    entries.forEach(entry => {
        const lines = entry.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return;

        const dateMatch = entry.match(REGEX_DATE_RANGE);
        const startDate = dateMatch ? dateMatch[1] : 'Unknown';
        const endDate = dateMatch ? dateMatch[2] : undefined;

        // Heuristic: Degree is the first line, Institution is the second.
        const degree = lines[0].replace(REGEX_DATE_RANGE, '').trim();
        const institution = lines[1] ? lines[1].trim() : 'Unknown';
        const description = lines.slice(2).join('\n').trim();

        educations.push({
            id: generateUniqueId(),
            degree,
            institution,
            startDate,
            endDate,
            description,
        });
    });

    return educations;
}

/* *
 * Parses skills from a text block.
 * @param text The text block for the "Skills" section.
 * @returns An array of Partial<Skill> objects.
 */
function parseSkills(text: string): Partial<Skill>[] {
    // Remove the heading itself from the text
    const skillsText = text.replace(REGEX_HEADING_SKILLS, '').trim();
    // Split by common delimiters like commas, newlines, or bullet points (•)
    const skillNames = skillsText.split(/[,;\n•]/).map(s => s.trim()).filter(s => s.length > 1);

    return skillNames.map(name => ({
        id: generateUniqueId(),
        name,
        category: 'technical', // Default category, can be improved with more logic
    }));
}


/* *
 * Parses languages from a text block.
 * @param text The text block for the "Languages" section.
 * @returns An array of Partial<Language> objects.
 */
function parseLanguages(text: string): Partial<Language>[] {
    const languagesText = text.replace(REGEX_HEADING_LANGUAGES, '').trim();
    const langEntries = languagesText.split(/[,;\n•]/).map(s => s.trim()).filter(s => s.length > 1);

    return langEntries.map(entry => {
        // Look for a language name and an optional level (e.g., "Anglais (C1)")
        const match = entry.match(/([a-zA-Zçéàè]+)\s*(?:\((B1|B2|C1|C2|A1|A2|Natif|Native)\))?/i);
        if (match) {
            return {
                id: generateUniqueId(),
                name: match[1],
                level: match[2] as Language['level'] || 'native', // Default to native if no level found
            };
        }
        return {
            id: generateUniqueId(),
            name: entry,
            level: 'native',
        };
    });
}


// --- MAIN PARSER FUNCTION ---

/* *
 * Parses the entire CV text and extracts structured data.
 * @param text The raw text extracted from the PDF.
 * @returns A CVFormData object with the parsed data.
 */
export function parseCVText(text: string): CVFormData {
    const sections = splitTextIntoSections(text);

    const cvData: CVFormData = {
        personalInfo: sections.personalInfo ? parsePersonalInfo(sections.personalInfo) : {},
        experiences: sections.experience ? parseExperiences(sections.experience) : [],
        education: sections.education ? parseEducation(sections.education) : [],
        skills: sections.skills ? parseSkills(sections.skills) : [],
        languages: sections.languages ? parseLanguages(sections.languages) : [],
    };

    return cvData;
}
