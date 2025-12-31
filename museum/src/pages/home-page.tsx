import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { 
  Laptop, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Menu
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { FaLinkedin, FaGithub } from "react-icons/fa";

// Import feature images
import chatImage from "@assets/Chat.png";
import collegesImage from "@assets/Colleges.png";
import profileImage from "@assets/Profile.png";
import advisorsImage from "@assets/Advisors.png";

// Import team profile images
import maxRomerImage from "@assets/MaxRomer.jpg";
import nickGrenobleImage from "@assets/NickGrenoble.jpg";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Logo />
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/auth")}
          >
            Log in
          </Button>
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setLocation("/onboarding")}
          >
            Sign up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-8 pb-16 px-4 max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tighter leading-tight">
            AI-Powered College<br />
            Counseling <span className="text-primary">For Everyone</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get personalized guidance through the college application process with AI that understands your unique goals and potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setLocation("/onboarding")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation("/auth")}
            >
              Log in
            </Button>
          </div>
        </div>

        {/* Features section removed */}
        
        {/* Feature Overview Section with Alternating Pattern */}
        <div className="space-y-24 mb-24">
          <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
          
          {/* Chat Feature */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="w-full md:w-1/2 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={chatImage} 
                alt="Chat interface" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <h3 className="text-2xl font-bold">Chat</h3>
              <p className="text-lg text-muted-foreground">
                Get personalized information, advice, and planning. Includes search and extended thinking features, as well as attachments upload.
              </p>
            </div>
          </div>
          
          {/* Colleges Feature */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16">
            <div className="w-full md:w-1/2 space-y-4">
              <h3 className="text-2xl font-bold">Colleges</h3>
              <p className="text-lg text-muted-foreground">
                Create your college list and receive intelligent recommendations. Chat always knows your current list.
              </p>
            </div>
            <div className="w-full md:w-1/2 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={collegesImage} 
                alt="Colleges management interface" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          
          {/* Profile Feature */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="w-full md:w-1/2 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={profileImage} 
                alt="User profile" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <h3 className="text-2xl font-bold">Profile</h3>
              <p className="text-lg text-muted-foreground">
                CollegeWayfarer remembers who you are, what your goals are, and what you're interested in. Your profile grows over time.
              </p>
            </div>
          </div>
          
          {/* Advisors Feature */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16">
            <div className="w-full md:w-1/2 space-y-4">
              <h3 className="text-2xl font-bold">Advisors</h3>
              <p className="text-lg text-muted-foreground">
                Share your application progress with advisors, parents, siblings, and others.
              </p>
            </div>
            <div className="w-full md:w-1/2 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={advisorsImage} 
                alt="Advisors management interface" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">FAQs</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b border-border/60">
                <AccordionTrigger className="text-lg font-medium hover:no-underline text-left">
                  Why should I use this over general chatbot applications?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  CollegeWayfarer is a specialized college planning platform built around a chatbot experience. 
                  It builds a written profile of you as an applicant, allows you to add colleges to Applying, 
                  Researching and Not Applying lists, and it will generate recommendations based on this information. 
                  Then, you can share all of this information about you as an applicant to your advisors.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-b border-border/60">
                <AccordionTrigger className="text-lg font-medium hover:no-underline text-left">
                  What AI models does CollegeWayfarer use?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  CollegeWayfarer leverages Google Gemini 2.0 Flash for most responses. When the Think Deeper toggle 
                  is enabled in a chat, it will instead use gemini-2.5-flash. When the Search toggle is enabled, 
                  it will utilize the Gemini API's Search Grounding tool, delivering results from Google Search into 
                  the message context.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-b border-border/60">
                <AccordionTrigger className="text-lg font-medium hover:no-underline text-left">
                  Is CollegeWayfarer free?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  CollegeWayfarer is 100% free, forever.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border-b border-border/60">
                <AccordionTrigger className="text-lg font-medium hover:no-underline text-left">
                  How is CollegeWayfarer personalized?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  During an initial onboarding process, you will fill out a short survey about you and your college plans. 
                  This information is then used by our AI to construct a comprehensive student profile. Throughout your 
                  interactions, CollegeWayfarer refers to this profile to ensure that the advice, college recommendations, 
                  and answers to your questions are specifically tailored to your unique situation and aspirations. 
                  The chat feature also adjusts its responses based on your current college list.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border-b border-border/60">
                <AccordionTrigger className="text-lg font-medium hover:no-underline text-left">
                  Is CollegeWayfarer open source?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! CollegeWayfarer's source code is available publicly on GitHub at{" "}
                  <a 
                    href="https://github.com/maximilianromer/collegewayfarer" 
                    className="text-primary hover:underline"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    https://github.com/maximilianromer/collegewayfarer
                  </a>
                  , under the MIT License. Feel free to self-host it, modify it, or reuse its code in your own projects.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Our Team Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Max Romer Card */}
            <div className="bg-card rounded-lg p-6 shadow-md border border-border/40 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={maxRomerImage} 
                    alt="Max Romer" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold">Max Romer</h3>
                  <p className="text-primary font-medium">Designer and Developer</p>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">
                Max is an undergraduate at Stanford University, planning to major in Symbolic Systems. 
                He grew up in Park City, UT, and enjoys hiking and following technological advancements in his free time.
              </p>
              <div className="mt-auto pt-4 flex gap-3 self-start">
                <a 
                  href="https://www.linkedin.com/in/maxromer/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-[#0077B5] hover:underline gap-1.5"
                >
                  <FaLinkedin className="h-5 w-5" />
                  <span>LinkedIn</span>
                </a>
                <a 
                  href="https://github.com/maximilianromer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-[#333] dark:text-[#ebebeb] hover:underline gap-1.5"
                >
                  <FaGithub className="h-5 w-5" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>

            {/* Nick Grenoble Card */}
            <div className="bg-card rounded-lg p-6 shadow-md border border-border/40 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={nickGrenobleImage} 
                    alt="Nick Grenoble" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold">Nick Grenoble</h3>
                  <p className="text-primary font-medium">Project Advisor</p>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">
                Nick Grenoble is the Senior Associate Director of College Counseling at the Waterford School. 
                He lives in Salt Lake City, UT.
              </p>
              <div className="mt-auto pt-4 flex gap-3 self-start">
                <a 
                  href="https://www.linkedin.com/in/a-nick-grenoble/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-[#0077B5] hover:underline gap-1.5"
                >
                  <FaLinkedin className="h-5 w-5" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col justify-center items-center">
            <div className="text-center">
              <Logo />
              <p className="text-sm text-muted-foreground mt-1">© 2025 CollegeWayfarer AI</p>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setLocation("/privacy")}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
