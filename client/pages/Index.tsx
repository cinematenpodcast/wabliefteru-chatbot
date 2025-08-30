import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type ChatMessage = { id: number; type: "ai" | "user"; content: string };

export default function Index() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "ai",
      content: "Stel een vraag over de Wabliefteru Podcast!"
    },
    {
      id: 2,
      type: "ai",
      content: "Vraag enkel over de inhoud van de afleveringen!"
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const WEBHOOK_URL =
    (import.meta as any).env?.VITE_WEBHOOK_URL ||
    "https://n8n.cinematen.be/webhook/wabliefteru-chatbot";

  const handleSend = async () => {
    if (inputValue.trim()) {
      const userText = inputValue;
      setMessages((prev: ChatMessage[]) => ([
        ...prev,
        {
          id: prev.length + 1,
          type: "user",
          content: userText
        }
      ]));
      setInputValue("");

      setIsLoading(true);
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: userText })
        });

        let replyText = "";
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          replyText =
            (typeof data?.message === "string" && data.message) ||
            (typeof data?.reply === "string" && data.reply) ||
            JSON.stringify(data);
        } else {
          replyText = await res.text();
        }

        setMessages((prev: ChatMessage[]) => ([
          ...prev,
          {
            id: prev.length + 1,
            type: "ai",
            content: replyText || "(Leeg antwoord)"
          }
        ]));
      } catch (_err) {
        setMessages((prev: ChatMessage[]) => ([
          ...prev,
          {
            id: prev.length + 1,
            type: "ai",
            content: "Oei! Er ging iets mis... Jammer! Maar bekijk het langs de positieve kant: ge hebt ten minste nog een job 😅"
          }
        ]));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Auto-scroll to the latest message when messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: "radial-gradient(50% 50% at 50% 50%,rgb(28, 87, 50) 0%,rgb(0, 41, 2) 100%)"
      }}
    >
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backdropFilter: "blur(32.5px)"
        }}
      />
      
      {/* Chat Container */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="flex justify-center pt-8 pb-4">
          <h1
            className="text-white text-2xl font-semibold"
            style={{
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
            }}
          >
            Wabliefteru Chatbot
          </h1>
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 px-4 pb-8 overflow-y-scroll scroll-smooth chat-scroll flex flex-col">
          <div className="w-full max-w-[792px] mt-auto space-y-10 mx-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "ai" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`px-4 py-5 rounded-xl text-white text-sm font-normal leading-normal ${
                    message.type === "ai"
                      ? "w-full max-w-[792px] px-6 py-6 rounded-2xl"
                      : "max-w-[459px] rounded-xl"
                  }`}
                  style={{
                    background:
                      message.type === "ai"
                        ? "rgba(34, 197, 94, 0.35)"
                        : "rgba(6, 78, 59, 0.86)",
                    border:
                      message.type === "ai"
                        ? "1px solid rgba(209, 250, 229, 0.30)"
                        : "1px solid rgba(16, 185, 129, 0.25)"
                  }}
                >
                  <div className="prose prose-invert max-w-none prose-headings:mt-0 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:text-white prose-a:text-white/90 hover:prose-a:text-white prose-a:underline prose-code:text-white">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                        img: ({ node, ...props }) => (
                          <img {...props} style={{ maxWidth: "100%", borderRadius: 8 }} />
                        ),
                        code: ({ className, children, ...props }) => (
                          <code
                            className={`${className ?? ""} rounded px-1.5 py-0.5 bg-black/30`}
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="w-full max-w-[792px] px-6 py-6 rounded-2xl text-white text-sm font-normal leading-normal"
                  style={{
                    background: "rgba(39, 168, 229, 0.4)",
                    border: "1px solid rgba(40, 42, 47, 0.6)"
                  }}
                >
                  Ik ga op zoek…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-4 pb-8">
          <div className="flex items-center justify-center">
            <div className="flex w-full max-w-[793px] h-12">
              {/* Input Field */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Typ hier je vraag"
                className="flex-1 h-12 px-4 text-xs font-normal leading-normal text-white placeholder-[#BABABA] rounded-l-xl border-none outline-none"
                style={{
                  background: "rgba(6, 78, 59, 0.85)",
                  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
                }}
              />
              
              {/* Send Button */}
              <button
                onClick={handleSend}
                className="w-11 h-12 flex items-center justify-center rounded-r-xl border-none outline-none cursor-pointer"
                style={{
                  background: "rgba(6, 78, 59, 0.9)"
                }}
              >
                <svg 
                  width="15" 
                  height="14" 
                  viewBox="0 0 15 14" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                >
                  <path 
                    d="M0.125 13.6666V0.333313L14.6389 6.99998L0.125 13.6666ZM1.65278 11.1666L10.7049 6.99998L1.65278 2.83331V5.74998L6.23611 6.99998L1.65278 8.24998V11.1666Z" 
                    fill="#8692A6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
