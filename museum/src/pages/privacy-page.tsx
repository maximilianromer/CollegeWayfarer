import { Link } from "wouter";
import Logo from "@/components/logo";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/home" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto prose dark:prose-invert">
          <h1>Privacy Policy for CollegeWayfarer</h1>
          <p className="text-muted-foreground">Last Updated: May 24, 2025</p>
          
          <p>Welcome to CollegeWayfarer ("us," "we," or "our"). We are committed to protecting your personal information and your right to privacy.</p>
          <p>When you visit our website and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy policy, we seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it. We hope you take some time to read through it carefully, as it is important.</p>
          <p>This privacy policy applies to all information collected through our Site and/or any related services, sales, marketing, or events (we refer to them collectively in this privacy policy as the "Services").</p>
          
          <h2>1. WHAT INFORMATION DO WE COLLECT?</h2>
          <h3>Personal information you disclose to us</h3>
          <ul>
            <li><strong>Account Information:</strong> When you register for an account, we collect your username and password.</li>
            <li><strong>Onboarding Information:</strong> During the onboarding process, we collect information you provide about your academic interests, preferences for academic environment and location, campus culture preferences, academic achievements, financial aid plans, and other factors important to you for college applications. This information is used to create your student profile.</li>
            <li><strong>Profile Description:</strong> We generate and store a profile description based on the information you provide.</li>
            <li><strong>Chat Messages and Attachments:</strong> We collect the content of your chat messages and any files you attach. This may include text, images, PDFs, and other document types.</li>
            <li><strong>College List Information:</strong> We store information about colleges you are applying to, researching, or not applying to, including their names and status.</li>
            <li><strong>Advisor Information:</strong> If you add advisors, we collect their name and type (e.g., school counselor, parent).</li>
            <li><strong>College Recommendations:</strong> We store college recommendations, which may include the college name, description, reasons for recommendation, acceptance rate, and notes from advisors.</li>
            <li><strong>Feedback Information:</strong> We collect feedback you provide on AI messages, including whether the feedback was positive or negative and the content of the message.</li>
          </ul>
          
          <h3>Information automatically collected</h3>
          <ul>
            <li><strong>Log and Usage Data:</strong> We collect log and usage data, which is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. This log data may include your IP address, device information, browser type, and settings and information about your activity in the Services.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We may use cookies and similar tracking technologies to access or store information.</li>
          </ul>
          
          <h2>2. HOW DO WE USE YOUR INFORMATION?</h2>
          <p>We use personal information collected via our Services for a variety of business purposes described below.</p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To provide and personalize our Services, such as generating your student profile and college recommendations.</li>
            <li>To manage your college lists and advisor information.</li>
            <li>To enable user-to-user communications (sharing with advisors).</li>
            <li>To send administrative information to you, such as information regarding changes to our terms, conditions, and policies.</li>
            <li>To protect our Services, including troubleshooting, data analysis, testing, system maintenance, and reporting.</li>
            <li>To respond to user inquiries and offer support.</li>
            <li>To improve our Services and user experience, including analyzing chat message feedback.</li>
            <li>For other business purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns, and to evaluate and improve our Services, products, marketing, and your experience.</li>
          </ul>
          
          <h2>3. WILL YOUR INFORMATION BE SHARED WITH ANYONE?</h2>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
          <ul>
            <li><strong>With Your Consent:</strong> We may share your personal information with third parties (such as advisors you add) when you explicitly consent for us to do so. You control which advisors can see your profile and chat sessions.</li>
            <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include: data storage providers (e.g., Neon, for database hosting), AI model providers (e.g., Google for profile generation and chat responses). We have contracts in place with our data processors.</li>
            <li><strong>Legal Obligations:</strong> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</li>
            <li><strong>Vital Interests:</strong> We may disclose your information where we believe it is necessary to investigate, prevent, or take action regarding potential violations of our policies, suspected fraud, situations involving potential threats to the safety of any person and illegal activities, or as evidence in litigation in which we are involved.</li>
          </ul>
          
          <h2>4. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
          <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. These include password hashing and using secure connections (HTTPS). However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
          
          <h2>5. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
          <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).</p>
          
          <h2>6. DO WE COLLECT INFORMATION FROM MINORS?</h2>
          <p>Our Services are intended for high school students who are typically over the age of 13. We do not knowingly collect personal information from children under 13 without parental consent. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will take steps to remove that information from Our servers.</p>
          
          <h2>7. DO WE MAKE UPDATES TO THIS POLICY?</h2>
          <p>We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy policy, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.</p>
        </div>
      </main>
      <footer className="border-t border-border/40 py-6 px-6 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 CollegeWayfarer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}