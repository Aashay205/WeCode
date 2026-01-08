import socket from "../socket/socket";
import { useEffect, useState, useRef } from "react";
import { debounce } from "../utils/debounce";

export default function useEditorSync({ roomId, userId, isHost }: { roomId: string, userId: string, isHost: boolean }) {
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [isRunning, setIsRunning] = useState(false)
    const [output, setOutput] = useState("");
    // const debouncedEmitRef = useRef<((value: string) => void) & { cancel?: () => void } | null>(
    //     null
    // );

    useEffect(() => {
        const handleCodeUpdate = ({
            code
        }: { code: string }) => {
            setCode(code);
        }

        const handleLanguageUpdate = ({
            language,
        }: { language: string }) => {
            setLanguage(language)
        }

        const handleExecutionResult = ({
            output,
            error
        }: {
            output?: string;
            error?: string;
        }) => {
            setIsRunning(false);
            setOutput(error || output || "")
        }

        socket.on("code-update", handleCodeUpdate);
        socket.on("language-update", handleLanguageUpdate);
        socket.on("execution-result", handleExecutionResult)

        return () => {
            socket.off("code-update", handleCodeUpdate);
            socket.off("language-update", handleLanguageUpdate);
            socket.off("execution-result", handleExecutionResult)
        };
    }, []);

    // useEffect(() => {
    //     debouncedEmitRef.current = debounce((value: string) => {
    //         if (!socket.connected) return;
    //         socket.emit("code-change", { roomId, code: value })
    //     }, 300)

    //     return () => {
    //         debouncedEmitRef.current?.cancel?.();
    //     };
    // }, [roomId])

    const onCodeChange = (value?: string) => {
        if (value == undefined) return;
        setCode(value);
        // debouncedEmitRef.current?.(value);
        socket.emit("code-change", {
            roomId,
            code: value,
        });
    };

    const onLanguageChange = (language: string) => {
        setLanguage(language);
        if (!isHost) return;

        socket.emit("language-change", {
            roomId,
            language,
            userId,
        })
    }

    const runCode = (input: string) => {
        if (!isHost) return;

        setIsRunning(true);
        setOutput("Running..")

        socket.emit("run-code", {
            roomId,
            code, language, input, userId,
        })
    }

    return {
        code,
        setCode,
        language,
        onCodeChange,
        onLanguageChange,
        runCode,
        output,
        isRunning,
    }
}