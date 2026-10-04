import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export const metadata = {
  title: "CrewApply - Account Deletion",
  description: "Information on how CrewApply users can request deletion of their account.",
};

export default function DeleteAccountPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans">
      <div className="w-full relative bg-white">
        <Navbar />
      </div>
      
      <main className="flex-1 pt-32 pb-20">
        <section className="px-6 lg:px-12 max-w-4xl mx-auto">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-line-soft">
            <h1 className="text-4xl font-extrabold text-heading mb-6">Delete Your CrewApply Account</h1>
            
            <div className="space-y-8 text-body leading-relaxed text-md">
              <section>
                <h2 className="text-xl font-bold text-heading mb-3">Who can request account deletion</h2>
                <p>
                  Any registered user of the CrewApply platform can request the deletion of their account and associated personal information at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-heading mb-3">How to request deletion</h2>
                <p>
                  You can request the deletion of your CrewApply account by contacting our support team directly.
                </p>
                <div className="mt-4 bg-surface p-6 rounded-2xl border border-line-soft flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Icon name="mail" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-heading text-lg mb-1">Email Request</h3>
                    <p className="mb-2">Send an email to our official support team at:</p>
                    <a href="mailto:crewapplyjobs@gmail.com" className="text-primary font-semibold hover:underline">
                      crewapplyjobs@gmail.com
                    </a>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-heading mb-3">What information is required</h2>
                <p>
                  To help us identify your account and process your request securely, please include the following in your email:
                </p>
                <ul className="list-disc pl-5 mt-3 space-y-2">
                  <li>The subject line: <strong>Account Deletion Request</strong></li>
                  <li>The full name associated with your CrewApply account</li>
                  <li>The email address registered with your account (please send the request from this email if possible)</li>
                  <li>Your phone number registered with the account (optional, for verification)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-heading mb-3">What happens after the request is submitted</h2>
                <p>
                  Once we receive your request, our support team will verify your identity to ensure the security of your account. We may reply to your email to confirm the deletion. Once verified, your account and profile will be permanently removed from active use on the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-heading mb-3">What data is deleted and retained</h2>
                <p>
                  Deleting your account removes your profile, resume, uploaded documents, and application history from active use on the Platform. As stated in our Privacy Policy, some information may be retained where required for legal, accounting, or fraud-prevention purposes, or where it forms part of an already-submitted job application that a recruiter still needs to process.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-heading mb-3">Need Help?</h2>
                <p>
                  If you have problems with the deletion request or have any other questions regarding your data, you can contact us at <a href="mailto:crewapplyjobs@gmail.com" className="text-primary font-semibold hover:underline">crewapplyjobs@gmail.com</a> and our team will assist you.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
