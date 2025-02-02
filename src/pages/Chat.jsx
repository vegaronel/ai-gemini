import { useState } from "react";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendHorizontal } from 'lucide-react';

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_KEY = "AIzaSyAdgri_uj6KS87-x2CdVy2y98t9F8A-75E"; // Replace with your API key
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "") {
      const newMessage = {
        id: Date.now(),
        text: inputMessage,
        sender: "user",
      };
      setMessages([...messages, newMessage]);
      setInputMessage("");

      // Set loading state while waiting for AI response
      setLoading(true);

      try {
        const response = await axios.post(
          API_URL,
          {
            contents: [
              {
                parts: [{ text: inputMessage }],
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      
        // Log the entire response to inspect it
        console.log("Gemini API Response:", response.data);
      
        // Check if the response contains the expected structure
        if (response.data && response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
          const aiMessage = {
            id: Date.now() + 1,
            text: response.data.candidates[0].content.parts[0].text,
            sender: "other",
          };
          // Add AI response to messages
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
        } else {
          throw new Error("Invalid response structure from Gemini API");
        }
      } catch (error) {
        console.error("Error fetching from Gemini API:", error);
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, something went wrong with AI response.",
          sender: "other",
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setLoading(false);
      }
      
    }
  };

  return (
    <Card className="w-full flex flex-col lg:max-w-lg md:max-w-lg  mx-auto  bg-slate-900 text-slate-100 border">
      <CardHeader>
        <CardTitle>ChatterBot</CardTitle>
      </CardHeader>
      <CardContent className="grow">
        <ScrollArea className="h-[650px] md:h-[500px] pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "other" && (
                <Avatar className="mr-2">
                  <AvatarImage src="https://ui.shadcn.com/avatars/02.png" alt="Avatar" />
                  <AvatarFallback>Chat Bot</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-2 max-w-[70%]  ${
                  message.sender === "user" ? "bg-primary text-primary-foreground bg-slate-50 text-slate-900" : "bg-slate-700 text-slate-50"
                }`}
              >
                {message.text}
              </div>
              {message.sender === "user" && (
                <Avatar className="ml-2">
                  <AvatarImage src="https://ui.shadcn.com/avatars/04.png" alt="Avatar" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-grow"
            disabled={loading}
          />
          <Button className="rounded bg-slate-700" type="submit" disabled={loading}>
            {loading ? "Sending..." : <SendHorizontal />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
