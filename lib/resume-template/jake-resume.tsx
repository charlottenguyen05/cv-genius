import { Document, Page, View, Text, Link } from '@react-pdf/renderer';
import { CVFormData } from '@/types';

// ---------------------------------------------------------------------------
// One-page enforcement: compute a scale factor from content density.
// Scale is clamped between SCALE_MIN (readability floor → 8pt) and 1.0.
// ---------------------------------------------------------------------------
const SCALE_MIN = 1.0; // Never scale below 1.0 — 10pt is the readability floor

function countBullets(text?: string): number {
    if (!text) return 0;
    return text.split('\n').filter(l => l.trim().length > 0).length;
}

export function computeScale(cvData: CVFormData): number {
    const expBullets = (cvData.experiences || []).reduce((n, e) => n + countBullets(e.description), 0);
    const eduBullets = (cvData.education || []).reduce((n, e) => n + countBullets(e.description), 0);
    const projBullets = (cvData.projects || []).reduce((n, e) => n + countBullets(e.description), 0);
    const expCount = (cvData.experiences || []).length;
    const eduCount = (cvData.education || []).length;
    const projCount = (cvData.projects || []).length;
    const skillCats = new Set((cvData.skills || []).map(s => s.category || 'Technical')).size;

    // Each heading block ≈ 2 units; each bullet ≈ 1 unit; skill/lang row ≈ 1 unit
    const weight =
        (expCount * 2 + expBullets) +
        (eduCount * 2 + eduBullets) +
        (projCount * 2 + projBullets) +
        skillCats +
        ((cvData.languages || []).length > 0 ? 1 : 0);

    // Empirically: weight ≤ 24 fits at scale 1.0 on a LETTER page with current styles.
    // Each extra unit beyond 24 reduces scale by 0.015, floored at SCALE_MIN.
    const excess = Math.max(0, weight - 24);
    const scale = Math.max(SCALE_MIN, 1.0 - excess * 0.015);
    return scale;
}

// ---------------------------------------------------------------------------
// Style builder — returns a fresh object scaled by `s`
// ---------------------------------------------------------------------------
function buildStyles(s: number) {
    const fs = (base: number) => Math.max(10, Math.round(base * s));
    const sp = (base: number) => Math.round(base * s);

    return {
        page: {
            fontFamily: 'CMU Serif',
            fontSize: fs(10),
            paddingTop: sp(28),
            paddingBottom: sp(28),
            paddingLeft: sp(32),
            paddingRight: sp(32),
        },
        headerName: {
            fontSize: fs(22),
            fontWeight: 'bold' as const,
            textAlign: 'center' as const,
            textTransform: 'uppercase' as const,
            letterSpacing: 1.5 * s,
        },
        contactRow: {
            textAlign: 'center' as const,
            fontSize: fs(9),
            marginTop: sp(1),
        },
        sectionTitle: {
            fontSize: fs(11),
            fontWeight: 'bold' as const,
            textTransform: 'uppercase' as const,
            letterSpacing: 1 * s,
            borderBottomWidth: 0.5,
            borderBottomColor: '#000',
            paddingBottom: sp(1),
            marginTop: sp(5),
            marginBottom: sp(2),
        },
        subheadingRow: {
            flexDirection: 'row' as const,
            justifyContent: 'space-between' as const,
            marginTop: sp(2),
        },
        subheadingLeft: {
            fontWeight: 'bold' as const,
            fontSize: fs(10),
            flex: 1,
            paddingRight: sp(8),
        },
        subheadingRight: {
            fontSize: fs(10),
            flexShrink: 0,
            textAlign: 'right' as const,
        },
        subheadingRow2: {
            flexDirection: 'row' as const,
            justifyContent: 'space-between' as const,
        },
        subheadingItalic: {
            fontStyle: 'italic' as const,
            fontSize: fs(9),
            flex: 1,
            paddingRight: sp(8),
        },
        bulletItem: {
            flexDirection: 'row' as const,
            marginLeft: sp(12),
            marginTop: sp(0),
        },
        bullet: { width: sp(8), fontSize: fs(9) },
        bulletText: { flex: 1, fontSize: fs(9) },
        skillRow: {
            flexDirection: 'row' as const,
            marginLeft: sp(8),
            marginTop: sp(1),
        },
        skillCategory: { fontWeight: 'bold' as const, fontSize: fs(9) },
        skillList: { fontSize: fs(9) },
    };
}

export const JakeResumeDocument = ({ cvData, scale }: { cvData: CVFormData; scale?: number }) => {
    // Use the provided scale (from server-side guard) or compute it here
    const s = scale !== undefined ? Math.max(SCALE_MIN, scale) : computeScale(cvData);
    const styles = buildStyles(s);

    const lang = cvData.outputLanguage || 'fr';

    const titles = {
        en: {
            education: 'Education',
            experience: 'Experience',
            projects: 'Projects',
            skills: 'Technical Skills'
        },
        fr: {
            education: 'Formation',
            experience: 'Experience Professionnelle',
            projects: 'Projets',
            skills: 'Compétences Techniques'
        }
    };

    const t = titles[lang];

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
            return `${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const { personalInfo, education, experiences, projects, skills, languages } = cvData;

    // Build contact row items dynamically to add dividers
    const contactItems = [];
    if (personalInfo?.phone) contactItems.push(<Text key="phone">{personalInfo.phone}</Text>);
    if (personalInfo?.email) contactItems.push(<Link key="email" src={`mailto:${personalInfo.email}`}>{personalInfo.email}</Link>);
    if (personalInfo?.linkedin) contactItems.push(<Link key="linkedin" src={personalInfo.linkedin}>{personalInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</Link>);
    if (personalInfo?.website) contactItems.push(<Link key="website" src={personalInfo.website}>{personalInfo.website.replace(/https?:\/\/(www\.)?/, '')}</Link>);
    if (personalInfo?.location) contactItems.push(<Text key="location">{personalInfo.location}</Text>);

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Header */}
                <View style={{ marginBottom: Math.round(4 * s) }}>
                    <Text style={styles.headerName}>{personalInfo?.name || 'VOTRE NOM'}</Text>
                    <View style={styles.contactRow}>
                        <Text>
                            {contactItems.map((item, index) => (
                                <Text key={index}>
                                    {item}
                                    {index < contactItems.length - 1 ? '  |  ' : ''}
                                </Text>
                            ))}
                        </Text>
                    </View>
                </View>

                {/* Education */}
                {education && education.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>{t.education}</Text>
                        {education.map((edu) => (
                            <View key={edu.id} style={{ marginBottom: Math.round(2 * s) }}>
                                <View style={styles.subheadingRow}>
                                    <Text style={styles.subheadingLeft}>{edu.institution}</Text>
                                    <Text style={styles.subheadingRight}>{edu.location || ''}</Text>
                                </View>
                                <View style={styles.subheadingRow2}>
                                    <Text style={styles.subheadingItalic}>
                                        {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                                    </Text>
                                    <Text style={styles.subheadingRight}>
                                        {formatDate(edu.startDate)} {edu.endDate ? `- ${formatDate(edu.endDate)}` : ''}
                                    </Text>
                                </View>
                                {edu.description && edu.description.split('\n').map((bullet, idx) => bullet.trim() ? (
                                    <View key={idx} style={styles.bulletItem}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{bullet.replace(/^[•\-\*]\s*/, '')}</Text>
                                    </View>
                                ) : null)}
                            </View>
                        ))}
                    </View>
                )}

                {/* Experience */}
                {experiences && experiences.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>{t.experience}</Text>
                        {experiences.map((exp) => (
                            <View key={exp.id} style={{ marginBottom: Math.round(2 * s) }}>
                                <View style={styles.subheadingRow}>
                                    <Text style={styles.subheadingLeft}>{exp.position}</Text>
                                    <Text style={styles.subheadingRight}>
                                        {formatDate(exp.startDate)} - {exp.isCurrentPosition ? (lang === 'fr' ? 'Présent' : 'Present') : formatDate(exp.endDate)}
                                    </Text>
                                </View>
                                <View style={styles.subheadingRow2}>
                                    <Text style={styles.subheadingItalic}>{exp.company}</Text>
                                    <Text style={styles.subheadingRight}>{exp.location || ''}</Text>
                                </View>
                                {exp.description && exp.description.split('\n').map((bullet, idx) => bullet.trim() ? (
                                    <View key={idx} style={styles.bulletItem}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{bullet.replace(/^[•\-\*]\s*/, '')}</Text>
                                    </View>
                                ) : null)}
                            </View>
                        ))}
                    </View>
                )}

                {/* Projects */}
                {projects && projects.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>{t.projects}</Text>
                        {projects.map((proj) => (
                            <View key={proj.id} style={{ marginBottom: Math.round(2 * s) }}>
                                <View style={styles.subheadingRow}>
                                    <Text style={styles.subheadingLeft}>
                                        {proj.name} {proj.technologies && <Text style={{ fontWeight: 'normal' }}>| <Text style={{ fontStyle: 'italic' }}>{proj.technologies}</Text></Text>}
                                    </Text>
                                    <Text style={styles.subheadingRight}>
                                        {formatDate(proj.startDate)} {proj.endDate ? `- ${formatDate(proj.endDate)}` : ''}
                                    </Text>
                                </View>
                                {proj.description && proj.description.split('\n').map((bullet, idx) => bullet.trim() ? (
                                    <View key={idx} style={styles.bulletItem}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{bullet.replace(/^[•\-\*]\s*/, '')}</Text>
                                    </View>
                                ) : null)}
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills & Languages */}
                {(skills && skills.length > 0) || (languages && languages.length > 0) ? (
                    <View>
                        <Text style={styles.sectionTitle}>{t.skills}</Text>

                        {/* Skills Grouped by Category */}
                        {skills && skills.length > 0 && (
                            <View>
                                {Array.from(new Set(skills.map(s => s.category || 'Technical'))).map(cat => (
                                    <View key={cat} style={styles.skillRow}>
                                        <Text style={styles.skillCategory}>{cat}: </Text>
                                        <Text style={styles.skillList}>
                                            {skills.filter(s => (s.category || 'Technical') === cat).map(s => s.name).join(', ')}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Languages */}
                        {languages && languages.length > 0 && (
                            <View style={styles.skillRow}>
                                <Text style={styles.skillCategory}>{lang === 'fr' ? 'Langues' : 'Languages'}: </Text>
                                <Text style={styles.skillList}>
                                    {languages.map(l => `${l.name} (${l.level})`).join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : null}

            </Page>
        </Document>
    );
};
