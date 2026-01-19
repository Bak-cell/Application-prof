
import { GoogleGenAI, Type } from "@google/genai";
import { Student, Assessment } from "./types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

export const generateStudentComment = async (student: Student, assessments: Assessment[]) => {
  const ai = getAIClient();
  const studentGrades = student.grades.map(g => {
    const assessment = assessments.find(a => a.id === g.assessmentId);
    return `${assessment?.title}: ${g.value}/20 (Coeff ${g.coefficient})`;
  }).join(", ");

  const prompt = `En tant que professeur principal d'un collège, rédige une appréciation trimestrielle concise et encourageante pour l'élève suivant :
  Nom : ${student.firstName} ${student.lastName}
  Notes : ${studentGrades || "Aucune note saisie."}
  
  L'appréciation doit être professionnelle, mettre en avant les points forts et suggérer des axes d'amélioration si nécessaire. Réponds en français.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de la génération de l'appréciation.";
  }
};

export const analyzeClassPerformance = async (students: Student[], assessments: Assessment[]) => {
  const ai = getAIClient();
  
  const dataSummary = students.map(s => {
    const avg = s.grades.length > 0 
      ? s.grades.reduce((acc, curr) => acc + curr.value, 0) / s.grades.length 
      : 0;
    return `${s.firstName} ${s.lastName}: Moyenne ${avg.toFixed(2)}`;
  }).join("\n");

  const prompt = `Analyse les performances globales de cette classe de collège :
  ${dataSummary}
  
  Identifie :
  1. Le niveau global de la classe.
  2. Les élèves en difficulté qui nécessitent un suivi particulier.
  3. Des conseils pédagogiques pour améliorer les résultats du groupe.
  
  Réponds sous forme de rapport structuré en français.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Impossible d'analyser la classe pour le moment.";
  }
};
