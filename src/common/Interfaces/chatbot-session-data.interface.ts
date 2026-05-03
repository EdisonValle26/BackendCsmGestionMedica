export type ChatbotSessionData = {
    specialty_id?: number;
    doctor_id?: number;
    date?: string | Date | null;
    time?: string | null;
    phone?: string;
    confirm?: string;
    previous_intent_id?: number;
    [key: string]: any;
};