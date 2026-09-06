import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { CVFormData } from '@/types';

// Styles replicating Jake's Resume LaTeX layout
const styles = StyleSheet.create({
    page: {
        fontFamily: 'CMU Serif',
        fontSize: 10,
        paddingTop: 36,    // ~0.5in
        paddingBottom: 36,
        paddingLeft: 36,
        paddingRight: 36,
    },
    // -- HEADER --
    headerName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',   // small-caps approximation
        letterSpacing: 1.5,
    },
    contactRow: {
        textAlign: 'center',
        fontSize: 9,
        marginTop: 2,
    },
    // -- SECTION --
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
        paddingBottom: 2,
        marginTop: 8,
        marginBottom: 4,
    },
    // -- SUBHEADING (Experience/Education) --
    subheadingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    subheadingLeft: { fontWeight: 'bold', fontSize: 10, flex: 1, paddingRight: 8 },
    subheadingRight: { fontSize: 10, flexShrink: 0, textAlign: 'right' },
    subheadingRow2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    subheadingItalic: { fontStyle: 'italic', fontSize: 9, flex: 1, paddingRight: 8 },
    // -- BULLET ITEMS --
    bulletItem: {
        flexDirection: 'row',
        marginLeft: 15,
        marginTop: 1,
    },
    bullet: { width: 8, fontSize: 9 },
    bulletText: { flex: 1, fontSize: 9 },
    // -- SKILLS --
    skillRow: {
        flexDirection: 'row',
        marginLeft: 10,
        marginTop: 1,
    },
    skillCategory: { fontWeight: 'bold', fontSize: 9 },
    skillList: { fontSize: 9 },
});

export const JakeResumeDocument = ({ cvData }: { cvData: CVFormData }) => {
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
                <View style={{ marginBottom: 8 }}>
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
                            <View key={edu.id} style={{ marginBottom: 4 }}>
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
                            <View key={exp.id} style={{ marginBottom: 4 }}>
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
                            <View key={proj.id} style={{ marginBottom: 4 }}>
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
