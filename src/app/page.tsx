"use client";

import { useState } from "react";
import Image from "next/image";
import Switch from "react-switch"; 
import { FloatingNav } from './components/floating-navbar';
import { faHome, faBell, faUser, faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExploreGrid from "./exploregrid";
import Collections from "./collectionList";
import { TagsInput } from './components/TagsInput'; 

const navItems = [
  {
    name: 'Home',
    link: '#home-section',
    icon: <FontAwesomeIcon icon={faHome} />,
  },
  {
    name: 'Explore',
    link: '#explore-section',
    icon: <FontAwesomeIcon icon={faBell} />,
  },
  {
    name: 'My Collections',
    link: '#collections-section',
    icon: <FontAwesomeIcon icon={faCog} />,
  },
  {
    name: 'Profile',
    link: '#profile-section',
    icon: <FontAwesomeIcon icon={faUser} />,
  },
];

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const response = await fetch("https://sbeeredd04--simple-text-to-image-inference-web.modal.run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage(`data:image/png;base64,${data.image}`);
      setInputText("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const userString = sessionStorage.getItem('user');
    console.log('Retrieved User:', userString); // Debug log to see what is retrieved
  
    if (!userString) {
      alert('User not logged in');
      return;
    }
  
    const { username } = JSON.parse(userString);
    if (!username) {
      alert('Username not available in session');
      return;
    }
  
    if (!generatedImage) {
      alert('No image generated to save');
      return;
    }
  
    const payload = {
      username,
      prompt: inputText,
      isPublic,
      tags: tags.join(','), // Convert tags array to comma-separated string
      imageData: generatedImage
    };
  
    try {
      const response = await fetch("http://127.0.0.1:5001/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error("Failed to save the image data");
      }
      alert('Image data saved successfully!');
      window.location.reload(); // Reload the window after saving
    } catch (error) {
      console.error("Error:", error);
      alert('Failed to save image data.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-8 bg-black text-white">
      <FloatingNav navItems={navItems} />
      
      <main className="flex-1">
        {/* Home Section */}
        <section id="home-section" className="flex flex-col items-center justify-center gap-4 py-8 min-h-screen">
          <div className="flex w-full max-w-4xl items-center justify-center space-x-8">
            <div className="flex-1 flex justify-center p-4">
              <Image
                src={generatedImage || "/placeholder.png"}
                alt="Generated"
                className="rounded-lg shadow-md max-w-md"
                width={500}
                height={500}
              />
            </div>
            <div className="flex-1 flex flex-col justify-center items-start space-y-4 p-4">
              <div className="flex items-center">
                <span className="mr-2 text-red-300">Public</span>
                <Switch onChange={setIsPublic} checked={isPublic} />
              </div>
              <TagsInput tags={tags} setTags={setTags} />
              <button
                onClick={handleSave}
                className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="w-full mt-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe the image you want to generate..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
        </section>
  
        {/* Explore Section */}
        <section id="explore-section" className="py-8 min-h-screen">
          <ExploreGrid />
        </section>
  
        {/* Collections Section */}
        <section id="collections-section" className="py-8 min-h-screen">
          <Collections />
        </section>
  
        {/* Profile Section */}
        <section id="profile-section" className="py-8 min-h-screen">
          <h2 className="text-xl font-bold text-red-500">Profile</h2>
         
        </section>
      </main>
    </div>
  );
}