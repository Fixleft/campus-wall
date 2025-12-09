import { useState } from "react"
import PostUploadCard from "@/components/PostUploadCard";
import AuthDialog from "@/components/AuthDialog";
import { useUser } from "@/context/UserContext";

export default function WritePostButton() {
    const [isOpen, setOpen] = useState(false);
    const [loginCardOpen, setLoginCardOpen] = useState(false);
    const { user } = useUser();
   

    function handleClick(){
        if (!user) {
            setLoginCardOpen(true);
            return;
        }
        setOpen(!isOpen);
        
    }
    return (
        <>
            <button 
            onClick={handleClick}
            className="fixed bottom-6 right-6 bg-black/90 hover:bg-black/70 rounded-full p-3.5 shadow-lg z-51">
                <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 640 640"
                className="h-7 w-7 shrink-0 text-white hover:scale-[120%] transition-transform duration-200 ease-in-out text-center"
                fill="currentColor"
                >
                <path d="M568.4 37.7C578.2 34.2 589 36.7 596.4 44C603.8 51.3 606.2 62.2 602.7 72L424.7 568.9C419.7 582.8 406.6 592 391.9 592C377.7 592 364.9 583.4 359.6 570.3L295.4 412.3C290.9 401.3 292.9 388.7 300.6 379.7L395.1 267.3C400.2 261.2 399.8 252.3 394.2 246.7C388.6 241.1 379.6 240.7 373.6 245.8L261.2 340.1C252.1 347.7 239.6 349.7 228.6 345.3L70.1 280.8C57 275.5 48.4 262.7 48.4 248.5C48.4 233.8 57.6 220.7 71.5 215.7L568.4 37.7z"/>
                </svg>
            </button>
            <PostUploadCard isOpen={isOpen} handleClick={handleClick} />
            {loginCardOpen && (
                    <AuthDialog
                      isOpen={loginCardOpen}
                      onClose={() => setLoginCardOpen(false)}
                    />
                  )}
        </>
    );
}