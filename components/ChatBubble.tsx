
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Sender } from '../types';
import { Search } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
          ${isUser 
            ? 'bg-primary-600 text-white rounded-br-none' 
            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
          }
        `}
      >
        {message.image && (
          <div className="mb-2 overflow-hidden rounded-lg">
            <img 
              src={message.image.startsWith('data:') ? message.image : `data:image/jpeg;base64,${message.image}`} 
              alt="Content" 
              className="max-w-full h-auto object-cover max-h-64"
            />
          </div>
        )}
        
        <div className={`text-sm md:text-base leading-relaxed prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                code: ({node, ...props}) => <code className="bg-black/10 rounded px-1 py-0.5" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
              }}
            >
              {message.text}
            </ReactMarkdown>
          )}
        </div>

        {/* Grounding Sources */}
        {!isUser && message.groundingChunks && message.groundingChunks.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">
               <Search className="w-3 h-3" />
               <span>Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.groundingChunks.map((chunk, idx) => {
                if (chunk.web?.uri) {
                  return (
                    <a 
                      key={idx} 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-gray-50 border border-gray-200 text-primary-600 px-2 py-1 rounded-md truncate max-w-[150px] hover:bg-primary-50 transition-colors"
                    >
                      {chunk.web.title || new URL(chunk.web.uri).hostname}
                    </a>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
        
        <div className={`text-[10px] mt-1 opacity-70 text-right`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
