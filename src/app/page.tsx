import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';

export default function Home() {
  return (
    <Page>
      <Page.Main className="flex flex-col items-center justify-center px-6 py-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8 max-w-md">
          <h1 className="text-3xl font-bold mb-3 text-gray-900">
            ProofBoard
          </h1>
          <p className="text-base text-gray-700 mb-2">
            Human-only Q&A powered by World ID
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Ask questions, share answers, and connect with real humans. Every action is verified to prevent bots and spam.
          </p>
        </div>

        {/* Auth Button */}
        <div className="w-full max-w-sm mb-8">
          <AuthButton />
        </div>

        {/* Why World ID Section */}
        <div className="w-full max-w-md space-y-4 mt-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <span className="text-2xl">🔐</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                Human-Only Verification
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                World ID ensures every post comes from a real, unique human—no bots, no spam, no fake accounts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <span className="text-2xl">🛡️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                Privacy-First Design
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We only store your wallet address. No email, no phone, no personal data. Your identity stays private.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <span className="text-2xl">✓</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                Fair Participation
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                One human, one voice. World ID prevents multi-account abuse and ensures everyone has an equal say.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-8 max-w-sm">
          By continuing, you agree to verify your humanity with World ID. This helps keep ProofBoard safe and spam-free for everyone.
        </p>
      </Page.Main>
    </Page>
  );
}
