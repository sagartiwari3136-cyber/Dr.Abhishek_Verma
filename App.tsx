
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from "@google/genai";
import { createChatSession, sendMessageToGemini, generateImage } from './services/gemini';
import { LiveClient } from './services/live';
import { Message, Sender, Tab, MediaItem, NewsItem, StoryItem, CarouselItem } from './types';
import { ChatBubble } from './components/ChatBubble';
import { 
  Send, ImageIcon, Mic, Menu, X, Trash2, 
  Home, Download, Play, Share2, User, Search, MessageCircle, ChevronRight, Settings, ChevronLeft, Heart,
  Headphones, Sparkles, Square, RectangleHorizontal, RectangleVertical
} from './components/Icons';

// --- Mock Data ---

const INITIAL_STORIES: StoryItem[] = [
  { id: '1', title: 'G20 Summit', imageUrl: 'https://images.unsplash.com/photo-1569403641778-1330b662c99b?q=80&w=400&auto=format&fit=crop', isUnseen: true, date: '2h', isLiked: false },
  { id: '2', title: 'Varanasi', imageUrl: 'https://images.unsplash.com/photo-1564102381821-b63007245640?q=80&w=400&auto=format&fit=crop', isUnseen: true, date: '4h', isLiked: false },
  { id: '3', title: 'ISRO Visit', imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=400&auto=format&fit=crop', isUnseen: false, date: '6h', isLiked: false },
  { id: '4', title: 'Army Day', imageUrl: 'https://images.unsplash.com/photo-1625757617379-10c489a2896d?q=80&w=400&auto=format&fit=crop', isUnseen: false, date: '12h', isLiked: false },
  { id: '5', title: 'Yoga Day', imageUrl: 'https://images.unsplash.com/photo-1599447292465-d92505b73676?q=80&w=400&auto=format&fit=crop', isUnseen: true, date: '1d', isLiked: false },
];

const CAROUSEL_ITEMS: CarouselItem[] = [
  { 
    id: '1', 
    title: 'New Digital India Initiative', 
    subtitle: 'Connecting every village with high-speed internet',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop' 
  },
  { 
    id: '2', 
    title: 'Expressway Inauguration', 
    subtitle: 'Reducing travel time by 50% between major cities',
    imageUrl: 'https://images.unsplash.com/photo-1463693396721-8ca0cfa2b3b5?q=80&w=1000&auto=format&fit=crop' 
  },
  { 
    id: '3', 
    title: 'Green Energy Revolution', 
    subtitle: 'World\'s largest solar park dedicated to the nation',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop' 
  },
  { 
    id: '4', 
    title: 'Youth Skill Development', 
    subtitle: 'Empowering 5 million students with new tech skills',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop' 
  }
];

const NEWS_DATA: Record<string, NewsItem[]> = {
  "Development": [
    {
      id: '1',
      title: 'Metro Expansion Phase 2 Approved',
      summary: 'Cabinet approves 50km extension to the metro line.',
      content: "In a landmark decision for urban mobility, the Cabinet has officially approved Phase 2 of the City Metro Expansion project. This ambitious phase will add 50 kilometers to the existing network, connecting the northern industrial hubs with the southern residential sectors.\n\nSpeaking at the press conference, Aditya Kumar emphasized that 'Connectivity is the backbone of economic growth.' The project is estimated to cost ₹12,000 Crores and is expected to be completed by 2028. It will feature state-of-the-art automated signaling systems and eco-friendly stations powered by solar energy.\n\nResidents have welcomed the move, citing relief from chronic traffic congestion.",
      date: '2h ago',
      source: 'InfraToday',
      imageUrl: 'https://images.unsplash.com/photo-1556554502-6c33c74b29e6?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: '2',
      title: 'New Airport Terminal Opens',
      summary: 'State-of-the-art terminal to handle 10M passengers.',
      content: "The new Terminal 3 at the International Airport was inaugurated today amidst great fanfare. Designed to handle an additional 10 million passengers annually, the terminal stands as a testament to modern engineering and traditional aesthetics.\n\nThe terminal features biometric check-in kiosks, automated baggage handling, and a dedicated wing for international cargo. Aditya Kumar, who laid the foundation stone three years ago, stated, 'This is not just a building; it is a gateway to global opportunities for our youth and businesses.'",
      date: '5h ago',
      source: 'Aviation Daily',
      imageUrl: 'https://images.unsplash.com/photo-1589765284652-d6e4f3890605?q=80&w=400&auto=format&fit=crop'
    }
  ],
  "Nation First": [
    {
      id: '3',
      title: 'Border Infrastructure Boost',
      summary: 'New roads and bridges dedicated to the armed forces.',
      content: "Strengthening national security, a series of 12 new bridges and 4 strategic roads were dedicated to the nation today. These infrastructure projects, located in the high-altitude border regions, are crucial for the swift movement of armed forces and logistics.\n\n'Our soldiers brave the harshest conditions to protect us. It is our duty to ensure they have the best infrastructure,' said Aditya Kumar during his visit to the forward areas. The roads are designed to withstand extreme weather conditions and heavy vehicle movement.",
      date: '1d ago',
      source: 'Defense News',
      imageUrl: 'https://images.unsplash.com/photo-1591521111478-10d9c50c326e?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: '4',
      title: 'Heritage Corridor Project',
      summary: 'Restoring ancient temples and cultural sites.',
      content: "The Heritage Corridor Project has reached a significant milestone with the completion of the restoration of the 11th-century Sun Temple complex. The project aims to revive the cultural glory of the region while boosting tourism.\n\nAditya Kumar inspected the site and praised the Archaeological Survey of India for their meticulous work. 'Our heritage is our identity. By preserving it, we pass on our values to the next generation,' he remarked. The corridor will now feature light and sound shows and a digital museum.",
      date: '2d ago',
      source: 'Culture Beat',
      imageUrl: 'https://images.unsplash.com/photo-1584883063385-d82525e30285?q=80&w=400&auto=format&fit=crop'
    }
  ],
  "Interviews": [
    {
      id: '5',
      title: 'Exclusive: Vision 2030',
      summary: 'Aditya Kumar discusses the roadmap for a developed nation.',
      content: "In an exclusive interview with The National, Aditya Kumar laid out his comprehensive roadmap for 'Vision 2030'. The blueprint focuses on three key pillars: Digital Empowerment, Sustainable Energy, and Skill Development.\n\n'We need to move from being job seekers to job creators,' he asserted. He highlighted plans to set up incubation centers in every district and subsidize renewable energy startups. When asked about challenges, he expressed confidence in the resilience of the citizens to adapt and thrive.",
      date: '3d ago',
      source: 'The National',
      imageUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: '6',
      title: 'Townhall with Students',
      summary: 'Answering questions from university students on policy.',
      content: "Over 5,000 students gathered at the City University Grounds for a candid townhall session with Aditya Kumar. The interactive session saw questions ranging from education policy reforms to climate change action.\n\nAddressing a query on research funding, he announced a new scholarship scheme for STEM researchers. 'You are the architects of New India. Your curiosity will drive our innovation,' he told the cheering crowd. The event concluded with a pledge to work towards a cleaner, greener campus.",
      date: '4d ago',
      source: 'Campus Connect',
      imageUrl: 'https://images.unsplash.com/photo-1544531696-24e367d9c8e4?q=80&w=400&auto=format&fit=crop'
    }
  ]
};

const GALLERY_ITEMS: MediaItem[] = [
  { id: '1', type: 'photo', url: 'https://images.unsplash.com/photo-1562569634-9ebf8d74deee?q=80&w=1000', thumbnail: 'https://images.unsplash.com/photo-1562569634-9ebf8d74deee?q=80&w=400', title: 'Youth Summit', date: 'Oct 12' },
  { id: '2', type: 'video', url: 'https://images.unsplash.com/photo-1544531696-24e367d9c8e4?q=80&w=1000', thumbnail: 'https://images.unsplash.com/photo-1544531696-24e367d9c8e4?q=80&w=400', title: 'Varanasi Rally', date: 'Sep 28' },
  { id: '3', type: 'photo', url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=1000', thumbnail: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=400', title: 'Metro Launch', date: 'Sep 15' },
  { id: '4', type: 'photo', url: 'https://images.unsplash.com/photo-1596386461350-326256694fe2?q=80&w=1000', thumbnail: 'https://images.unsplash.com/photo-1596386461350-326256694fe2?q=80&w=400', title: 'Farmers Meet', date: 'Aug 20' },
  { id: '5', type: 'video', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000', thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400', title: 'Cabinet Briefing', date: 'Aug 10' },
  { id: '6', type: 'photo', url: 'https://images.unsplash.com/photo-1577017040065-b9b71fc29bb2?q=80&w=1000', thumbnail: 'https://images.unsplash.com/photo-1577017040065-b9b71fc29bb2?q=80&w=400', title: 'Swachh Bharat', date: 'Jul 22' },
];

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1", icon: Square },
  { label: "3:4", value: "3:4", icon: RectangleVertical },
  { label: "4:3", value: "4:3", icon: RectangleHorizontal },
  { label: "16:9", value: "16:9", icon: RectangleHorizontal },
  { label: "9:16", value: "9:16", icon: RectangleVertical },
];

// --- Helper: Base64 conversion ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// --- Components ---

interface StoryViewerProps {
  stories: StoryItem[];
  activeIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onLike: (id: string) => void;
  onMarkSeen: (id: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ 
  stories, activeIndex, onClose, onNext, onPrev, onLike, onMarkSeen 
}) => {
  const [progress, setProgress] = useState(0);
  const DURATION = 5000;
  const startTimeRef = useRef(Date.now());
  const animationRef = useRef<number>();
  const story = stories[activeIndex];

  useEffect(() => {
    if (!story) return;

    // Reset
    setProgress(0);
    startTimeRef.current = Date.now();
    onMarkSeen(story.id);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onNext();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeIndex, story, onMarkSeen, onNext]);

  if (!story) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-4 safe-area-top">
        {stories.map((s, idx) => (
          <div key={s.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: idx === activeIndex ? `${progress}%` : (idx < activeIndex ? '100%' : '0%')
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 z-20 flex justify-between items-center px-4 py-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="text-white">
              <span className="text-sm font-bold block leading-none text-shadow-sm">Aditya Kumar</span>
              <span className="text-[10px] opacity-80 text-shadow-sm">{story.date || '2h'}</span>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-white/80 hover:text-white p-2"
          >
            <X className="w-6 h-6 drop-shadow-md" />
          </button>
      </div>

      {/* Main Content Area with Tap Navigation */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
        <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        
        {/* Tap Areas */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 h-full" onClick={onPrev} />
          <div className="flex-[2] h-full" onClick={onNext} />
        </div>

        {/* Caption */}
        <div className="absolute bottom-24 left-4 z-10 pointer-events-none max-w-[80%]">
            <h2 className="text-white text-xl font-bold drop-shadow-md leading-tight">{story.title}</h2>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-4 z-20 pb-8">
          <div className="flex-1">
            <div className="w-full bg-transparent border border-white/40 rounded-full px-4 py-2.5 text-white/70 text-sm">
              Send a message...
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(story.id); }}
            className="text-white transition-transform active:scale-75"
          >
            <Heart className={`w-7 h-7 drop-shadow-md ${story.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <button className="text-white">
            <Share2 className="w-6 h-6 drop-shadow-md" />
          </button>
      </div>
    </div>
  );
};


export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Home);
  const [stories, setStories] = useState<StoryItem[]>(INITIAL_STORIES);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Live API State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const liveClientRef = useRef<LiveClient | null>(null);

  // Image Gen State
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- Effects ---
  useEffect(() => {
    const initChat = async () => {
      try {
        const chat = createChatSession();
        setChatSession(chat);
      } catch (e) {
        console.error("Failed to initialize chat", e);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (activeTab === Tab.Connect) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, activeTab]);

  // Auto-rotate carousel
  useEffect(() => {
    if (activeTab === Tab.Home && !selectedNews && activeStoryIndex === null) {
      const interval = setInterval(() => {
        setCurrentCarouselIndex(prev => (prev + 1) % CAROUSEL_ITEMS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedNews, activeStoryIndex]);

  // --- Logic ---
  const handleLikeStory = (storyId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, isLiked: !s.isLiked } : s));
  };
  
  const markStoryAsSeen = useCallback((storyId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, isUnseen: false } : s));
  }, []);

  const handleNextStory = useCallback(() => {
    if (activeStoryIndex !== null) {
      if (activeStoryIndex < stories.length - 1) {
        setActiveStoryIndex(activeStoryIndex + 1);
      } else {
        setActiveStoryIndex(() => null);
      }
    }
  }, [activeStoryIndex, stories.length]);

  const handlePrevStory = useCallback(() => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  }, [activeStoryIndex]);

  // --- Live API Logic ---
  const toggleLiveMode = async () => {
    if (isLiveActive) {
      // Disconnect
      if (liveClientRef.current) {
        await liveClientRef.current.disconnect();
        liveClientRef.current = null;
      }
      setIsLiveActive(false);
    } else {
      // Connect
      try {
        const client = new LiveClient();
        client.onVolumeChange = (vol) => setAudioVolume(vol);
        await client.connect(() => setIsLiveActive(false));
        liveClientRef.current = client;
        setIsLiveActive(true);
      } catch (error) {
        console.error("Failed to start live session", error);
      }
    }
  };

  // --- Image Gen Logic ---
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGeneratingImage(true);
    setShowImageGen(false); // Close modal
    setShowWelcome(false);

    // Add user message
    const userMsg: Message = {
      id: uuidv4(),
      text: `Generate an image: ${imagePrompt} (${selectedRatio})`,
      sender: Sender.User,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Add loading placeholder
    const modelMsgId = uuidv4();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      text: "🎨 Creating your image...",
      sender: Sender.Model,
      timestamp: new Date()
    }]);

    try {
       const { imageUrl } = await generateImage(imagePrompt, selectedRatio);
       if (imageUrl) {
         setMessages(prev => prev.map(msg => 
           msg.id === modelMsgId 
             ? { ...msg, text: `Here is the image for "${imagePrompt}"`, image: imageUrl }
             : msg
         ));
       } else {
         setMessages(prev => prev.map(msg => 
           msg.id === modelMsgId ? { ...msg, text: "Sorry, I couldn't generate that image." } : msg
         ));
       }
    } catch (e) {
      console.error(e);
       setMessages(prev => prev.map(msg => 
           msg.id === modelMsgId ? { ...msg, text: "Error generating image." } : msg
         ));
    } finally {
      setIsGeneratingImage(false);
      setImagePrompt('');
    }
  };

  // --- Chat Logic ---
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setSelectedImage(base64);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
  };

  const clearImage = () => setSelectedImage(null);

  const clearChat = useCallback(() => {
    setMessages([]);
    setShowWelcome(true);
    setChatSession(createChatSession());
    setIsDrawerOpen(false);
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !chatSession || isLoading) return;

    const currentInput = input.trim();
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    if (inputAreaRef.current) inputAreaRef.current.style.height = 'auto';
    setShowWelcome(false);

    const userMsgId = uuidv4();
    const userMsg: Message = {
      id: userMsgId,
      text: currentInput,
      sender: Sender.User,
      timestamp: new Date(),
      image: currentImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const modelMsgId = uuidv4();
    const modelMsg: Message = {
      id: modelMsgId,
      text: '',
      sender: Sender.Model,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, modelMsg]);

    try {
      const streamResult = await sendMessageToGemini(chatSession, currentInput, currentImage || undefined);
      
      let fullText = '';
      for await (const chunk of streamResult) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
        }

        // Extract grounding metadata if available
        const grounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;

        setMessages(prev => 
          prev.map(msg => 
            msg.id === modelMsgId 
            ? { 
                ...msg, 
                text: fullText,
                groundingChunks: grounding ? grounding : msg.groundingChunks 
              } 
            : msg
          )
        );
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === modelMsgId ? { ...msg, text: "Network error. Please check your connection.", isError: true } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Screen Components (Inline for simplicity, normally separate files) ---

  const DashboardScreen = () => (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto no-scrollbar pb-24">
      {/* Stories Section */}
      <div className="bg-white pt-4 pb-4 border-b border-gray-100">
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-4">
          {stories.map((story, index) => (
            <div 
              key={story.id} 
              onClick={() => setActiveStoryIndex(index)}
              className="flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer transition-transform active:scale-95"
            >
              <div className={`w-16 h-16 rounded-full p-[2px] ${story.isUnseen ? 'bg-gradient-to-tr from-orange-400 to-red-600' : 'bg-gray-200'}`}>
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden relative bg-gray-100">
                  <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className={`text-[10px] font-medium truncate max-w-full ${story.isUnseen ? 'text-gray-800' : 'text-gray-500'}`}>
                {story.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Carousel Section */}
      <div className="mt-4 px-4">
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-sm bg-gray-200">
          {CAROUSEL_ITEMS.map((item, index) => (
            <div 
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentCarouselIndex ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                 <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-2">TOP STORY</span>
                 <h3 className="text-white font-bold text-lg leading-tight mb-1">{item.title}</h3>
                 <p className="text-gray-200 text-xs line-clamp-2">{item.subtitle}</p>
              </div>
            </div>
          ))}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {CAROUSEL_ITEMS.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentCarouselIndex ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Categorized News Sections */}
      <div className="mt-6 space-y-8">
        {Object.entries(NEWS_DATA).map(([category, items]) => (
          <div key={category} className="flex flex-col">
             <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-base font-bold text-gray-800 border-l-4 border-primary-500 pl-2">{category}</h3>
                <button className="text-primary-600 text-xs font-semibold flex items-center">
                  View All <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
             </div>
             <div className="flex overflow-x-auto no-scrollbar px-4 gap-3 pb-2">
               {items.map((item) => (
                 <div 
                   key={item.id} 
                   onClick={() => setSelectedNews(item)}
                   className="min-w-[240px] w-[240px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
                 >
                    <div className="h-32 w-full bg-gray-200 relative">
                       <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                       <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">{item.source}</div>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                       <h4 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 mb-1">{item.title}</h4>
                       <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.summary}</p>
                       <div className="mt-auto text-[10px] text-gray-400">{item.date}</div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const NewsDetailScreen = ({ news }: { news: NewsItem }) => (
    <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar pb-20 animate-fade-in z-40 relative">
       <div className="sticky top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent h-20 pointer-events-none">
          <button 
             onClick={() => setSelectedNews(null)} 
             className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg pointer-events-auto hover:bg-white/30"
          >
             <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg pointer-events-auto hover:bg-white/30">
             <Share2 className="w-5 h-5" />
          </button>
       </div>
       <div className="relative h-72 -mt-20 w-full">
          <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
             <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm mb-2 inline-block">{news.source}</span>
             <h1 className="text-xl font-bold text-white leading-tight">{news.title}</h1>
             <p className="text-gray-300 text-xs mt-2">{news.date} • 5 min read</p>
          </div>
       </div>
       <div className="p-6">
          <p className="text-base text-gray-700 leading-relaxed font-serif whitespace-pre-line">
             {news.content || news.summary}
          </p>
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
             <h4 className="text-sm font-bold text-gray-800 mb-2">Related Topics</h4>
             <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">Politics</span>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">Development</span>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">India</span>
             </div>
          </div>
       </div>
    </div>
  );

  const ConnectScreen = () => (
    <div className="flex flex-col h-full relative bg-gray-50">
      <div className="absolute top-4 right-4 z-20">
         <button 
            onClick={toggleLiveMode}
            className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-gray-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
         >
            <Headphones className="w-5 h-5" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-4 pb-20 pt-14">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center pt-10 px-6 animate-fade-in">
             <div className="w-24 h-24 mb-6 rounded-full overflow-hidden border-4 border-orange-100 shadow-lg bg-white">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" 
                  alt="Aditya Kumar" 
                  className="w-full h-full object-cover"
                />
             </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Namaste!</h2>
            <p className="text-gray-500 text-center text-sm max-w-[260px]">
              Connect directly with Aditya Kumar's digital office. Share your suggestions, ask about policies, or report issues.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 w-full">
              {["How can I join the volunteer team?", "Details on the new highway project?", "I have a suggestion for education."].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-sm bg-white border border-gray-200 py-3 px-4 rounded-xl text-gray-700 shadow-sm hover:bg-orange-50 hover:border-orange-200 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-full">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex w-full mb-4 justify-start animate-pulse">
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-white px-3 py-3 border-t border-gray-100 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
           {selectedImage && (
              <div className="relative inline-block mb-2 ml-2">
                <img 
                  src={`data:image/jpeg;base64,${selectedImage}`} 
                  alt="Preview" 
                  className="h-16 w-16 object-cover rounded-xl border border-gray-200 shadow-sm"
                />
                <button 
                  onClick={clearImage}
                  className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5 shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
           )}

           <div className="flex items-end gap-2 bg-gray-50 rounded-[24px] p-1.5 pl-2 border border-gray-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100 transition-all duration-200">
             <button 
                onClick={() => setShowImageGen(true)}
                className="mb-1.5 p-2 text-gray-400 hover:text-purple-500 transition-colors rounded-full hover:bg-purple-50 active:scale-90"
              >
                <Sparkles className="w-5 h-5" />
             </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mb-1.5 p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-100 active:scale-90"
            >
              <ImageIcon className="w-5 h-5" />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageSelect}
              />
            </button>
            
            <textarea 
              ref={inputAreaRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 max-h-32 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 py-2.5 resize-none text-base leading-relaxed"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {input.trim() || selectedImage ? (
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="mb-1 p-2 bg-primary-600 text-white rounded-full shadow-md hover:bg-primary-700 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Send className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" />
              </button>
            ) : (
              <button className="mb-1.5 p-2 text-gray-400 rounded-full">
                 <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
      </div>
      
      {/* Live Mode Overlay */}
      {isLiveActive && (
         <div className="absolute inset-0 z-50 bg-gradient-to-br from-gray-900 to-primary-900 text-white flex flex-col animate-fade-in">
            <div className="flex justify-end p-6">
               <button onClick={toggleLiveMode} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                  <X className="w-6 h-6" />
               </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
               <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary-500 to-red-500 flex items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.3)] relative mb-8">
                   <div 
                     className="absolute inset-0 rounded-full border-2 border-white/30 scale-110"
                     style={{ transform: `scale(${1 + audioVolume})`, opacity: 0.5 + audioVolume }} 
                   />
                   <div 
                     className="absolute inset-0 rounded-full border border-white/20 scale-125"
                     style={{ transform: `scale(${1.2 + (audioVolume * 1.5)})`, opacity: 0.3 + audioVolume }} 
                   />
                   <Mic className="w-10 h-10 text-white" />
               </div>
               <h2 className="text-2xl font-bold tracking-tight">Listening...</h2>
               <p className="text-white/50 mt-2 text-sm">Aditya Kumar AI Assistant</p>
            </div>
         </div>
      )}
      
      {/* Image Gen Drawer */}
      {showImageGen && (
         <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
            <div className="flex-1" onClick={() => setShowImageGen(false)} />
            <div className="bg-white rounded-t-3xl p-6 animate-slide-in-bottom shadow-2xl">
               <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-purple-500" />
                 Create Image
               </h3>
               
               <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Prompt</label>
               <textarea 
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="A futuristic smart city in India..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24 mb-4"
               />
               
               <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Aspect Ratio</label>
               <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
                  {ASPECT_RATIOS.map((ratio) => (
                     <button
                        key={ratio.value}
                        onClick={() => setSelectedRatio(ratio.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border min-w-[80px] transition-all ${
                           selectedRatio === ratio.value 
                           ? 'border-purple-500 bg-purple-50 text-purple-600' 
                           : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                     >
                        <ratio.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{ratio.label}</span>
                     </button>
                  ))}
               </div>
               
               <button 
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || isGeneratingImage}
                  className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 disabled:shadow-none transition-all"
               >
                  {isGeneratingImage ? 'Generating...' : 'Generate Image'}
               </button>
            </div>
         </div>
      )}
    </div>
  );

  const MediaScreen = () => (
    <div className="h-full overflow-y-auto p-4 bg-gray-50 pb-24 no-scrollbar">
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-1">Media Gallery</h2>
      <div className="grid grid-cols-2 gap-3">
        {GALLERY_ITEMS.map((item) => (
          <div 
            key={item.id} 
            onClick={() => setViewingMedia(item)}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer group"
          >
            <div className="relative aspect-[4/5]">
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              {item.type === 'video' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white/30 backdrop-blur-sm p-2 rounded-full shadow-lg">
                      <Play className="w-6 h-6 text-white fill-white" />
                   </div>
                </div>
              ) : (
                <div className="absolute bottom-2 right-2">
                   <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded-lg">
                      <Download className="w-4 h-4 text-white" />
                   </div>
                </div>
              )}
            </div>
            <div className="p-2.5">
               <h3 className="text-sm font-semibold text-gray-800 truncate">{item.title}</h3>
               <p className="text-[10px] text-gray-500 mt-0.5">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="h-full overflow-y-auto bg-gray-50 pb-24 no-scrollbar">
       <div className="relative h-56">
         <img 
          src="https://images.unsplash.com/photo-1542621334-a254cf47733d?q=80&w=1000" 
          className="w-full h-full object-cover" 
          alt="Banner"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
         <div className="absolute -bottom-10 left-6 w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
         </div>
       </div>
       <div className="pt-12 px-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Aditya Kumar</h1>
              <p className="text-sm text-primary-600 font-medium">Member of Parliament</p>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md hover:bg-primary-700 transition-colors">
               Join Movement
            </button>
          </div>
          <div className="mt-6">
            <h3 className="font-bold text-gray-800 mb-2">Biography</h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              Dedicated to the service of the nation. Focusing on sustainable development, education for all, and technological advancement in rural India. Serving the people since 2014.
            </p>
          </div>
          {/* Journey Timeline & Family Section (Simplified for brevity) */}
       </div>
    </div>
  );

  // --- Render ---
  return (
    <div className="flex justify-center bg-gray-900 min-h-screen w-full font-sans">
      {/* Mobile Simulation Container */}
      <div className="relative w-full max-w-md h-[100dvh] bg-white shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <header className="h-14 px-4 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
             {activeTab === Tab.Home && !selectedNews ? (
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-200">
                   AK
                 </div>
                 <div>
                    <h1 className="text-sm font-bold text-gray-800 leading-none">Aditya Kumar</h1>
                    <span className="text-[10px] text-gray-500">Official App</span>
                 </div>
               </div>
             ) : (
               <h1 className="text-lg font-bold text-gray-800 capitalize tracking-tight">
                 {selectedNews ? '' : (activeTab === Tab.Connect ? 'Connect with AK' : activeTab)}
               </h1>
             )}
          </div>
          <div className="flex gap-2">
            {activeTab === Tab.Home && !selectedNews && (
               <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                 <Search className="w-5 h-5" />
               </button>
            )}
            {!selectedNews && (
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative bg-gray-50">
          {activeTab === Tab.Home && (
             selectedNews ? <NewsDetailScreen news={selectedNews} /> : <DashboardScreen />
          )}
          {activeTab === Tab.Connect && <ConnectScreen />}
          {activeTab === Tab.Media && <MediaScreen />}
          {activeTab === Tab.Profile && <ProfileScreen />}
        </main>

        {/* Bottom Navigation */}
        {!selectedNews && (
          <nav className="h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
             <button 
               onClick={() => setActiveTab(Tab.Home)}
               className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200 ${activeTab === Tab.Home ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <Home className={`w-6 h-6 ${activeTab === Tab.Home ? 'fill-current' : ''}`} strokeWidth={activeTab === Tab.Home ? 2.5 : 2} />
               <span className="text-[10px] font-medium mt-1">Home</span>
             </button>
             <button 
               onClick={() => setActiveTab(Tab.Connect)}
               className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200 ${activeTab === Tab.Connect ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <MessageCircle className={`w-6 h-6 ${activeTab === Tab.Connect ? 'fill-current' : ''}`} strokeWidth={activeTab === Tab.Connect ? 2.5 : 2} />
               <span className="text-[10px] font-medium mt-1">Connect</span>
             </button>
             <button 
               onClick={() => setActiveTab(Tab.Media)}
               className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200 ${activeTab === Tab.Media ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <ImageIcon className={`w-6 h-6 ${activeTab === Tab.Media ? 'fill-current' : ''}`} strokeWidth={activeTab === Tab.Media ? 2.5 : 2} />
               <span className="text-[10px] font-medium mt-1">Media</span>
             </button>
             <button 
               onClick={() => setActiveTab(Tab.Profile)}
               className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200 ${activeTab === Tab.Profile ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <User className={`w-6 h-6 ${activeTab === Tab.Profile ? 'fill-current' : ''}`} strokeWidth={activeTab === Tab.Profile ? 2.5 : 2} />
               <span className="text-[10px] font-medium mt-1">Profile</span>
             </button>
          </nav>
        )}

        {/* Full Screen Story Viewer Overlay */}
        {activeStoryIndex !== null && (
          <StoryViewer 
             stories={stories}
             activeIndex={activeStoryIndex}
             onClose={() => setActiveStoryIndex(null)}
             onNext={handleNextStory}
             onPrev={handlePrevStory}
             onLike={handleLikeStory}
             onMarkSeen={markStoryAsSeen}
          />
        )}

        {/* Drawer */}
        {isDrawerOpen && (
          <div className="absolute inset-0 z-50 flex">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="relative w-[75%] max-w-xs h-full bg-white shadow-xl flex flex-col animate-slide-in-left">
              <div className="h-40 bg-gradient-to-br from-orange-500 to-red-600 flex flex-col justify-end p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Home className="w-32 h-32 text-white" />
                </div>
                <h2 className="text-2xl font-bold relative z-10">Aditya Kumar</h2>
                <p className="text-sm opacity-90 relative z-10">Official Mobile App</p>
              </div>
              <div className="p-4 space-y-2 flex-1 overflow-y-auto">
                 <button 
                  onClick={clearChat}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-sm font-medium"
                 >
                  <Trash2 className="w-5 h-5" />
                  <span>Reset Chat</span>
                </button>
                <div className="h-px bg-gray-100 my-2"></div>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium">
                   <Share2 className="w-5 h-5" />
                   <span>Share App</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Modal */}
        {viewingMedia && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col animate-fade-in">
             <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                <button onClick={() => setViewingMedia(null)} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
                   <X className="w-5 h-5" />
                </button>
                <div className="flex gap-3">
                  <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                     <Share2 className="w-5 h-5" />
                  </button>
                </div>
             </div>
             <div className="flex-1 flex items-center justify-center p-4">
                <img src={viewingMedia.url} alt={viewingMedia.title} className="max-w-full max-h-full object-contain rounded-md" />
             </div>
             <div className="p-6 pb-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
                <h3 className="text-xl font-bold">{viewingMedia.title}</h3>
                <p className="text-gray-300 text-sm mt-1">{viewingMedia.date} • Official Media</p>
             </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slide-in-bottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </div>
  );
}
