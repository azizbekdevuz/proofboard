import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import Link from 'next/link';

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
        <div className="w-full max-w-sm mb-4">
          <AuthButton />
        </div>

        {/* Demo Mode Link */}
        <div className="w-full max-w-sm mb-8">
          <Link 
            href="/home/thoughts"
            className="block w-full text-center py-3 px-4 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Browse Demo (Read-Only)
          </Link>
          <p className="text-xs text-gray-500 text-center mt-2">
            View questions without signing in. Posting requires World App.
          </p>
        </div>

        {/* Why World ID is Essential */}
        <div className="w-full max-w-md space-y-3 mt-4">
          <h2 className="text-base font-bold text-gray-900 mb-2">Why World ID?</h2>
          
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
            <span className="text-xl">❌</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                Without Proof of Personhood
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                One person creates 100 accounts → floods boards with spam → manipulates votes → drowns out real voices.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
            <span className="text-xl">✅</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                With World ID Verify
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                One human = one voice per action → significantly reduces Sybil attacks → fair participation for everyone.
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-900">Privacy-first:</span> We only store your wallet address. No email, no phone, no personal data. World ID proves you're human without revealing who you are.
            </p>
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
