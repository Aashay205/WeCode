import axios from "axios"


interface ExecutionResult {
    output: string,
    error: string | null,
}

const languageMap: Record<string, string> = {
    javascript: "nodejs",
    python: "python3",
    cpp: "cpp17",
    java: "java"
};


export async function executeCode(
    code: string,
    language: string,
    input: string
): Promise<ExecutionResult> {
    const jdoodleLanguage = languageMap[language];

    if (!jdoodleLanguage) {
        return {
            output: "",
            error: `Unsupported language : ${language}`
        };
    }


    try {
        const response = await axios.post("https://api.jdoodle.com/v1/execute", {
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            script: code,
            language: jdoodleLanguage,
            stdin: input,
        }, {
            headers: {
                "Content-Type": "application/json",
            },
            timeout: 10000,
        })
        const { output, statusCode } = response.data;
        
        if (statusCode !== 200) {
            return {
                output: "",
                error: output || "Execution failed",
            }
        }
        return {
            output: output ?? "",
            error: null,
        }
    }
    catch (err: any) {
        return {
            output: "",
            error: "Error while executing code"
        }
    }
}