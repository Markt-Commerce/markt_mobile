import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";

// Mirrors https://marktcommerce.com/terms-of-service/ — the copy the sign-in
// screens link to. Change both together.

function Section({ title, last, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <View className={last ? "mb-12" : "mb-8"}>
      <Text className="font-bold text-lg mb-4 text-text-primary">{title}</Text>
      {children}
    </View>
  );
}

function Body({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-sm leading-6 text-text-secondary ${className}`}>{children}</Text>;
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text className="font-bold text-text-primary">{children}</Text>;
}

const PROHIBITED_CONTRIBUTIONS = [
  "is hateful, discriminatory, or attacks a person or group on the basis of race, ethnicity, religion, gender, sexual orientation, disability, or any other identity;",
  "harasses, bullies, threatens, intimidates, or abuses any person;",
  "contains nudity, pornography, or sexually explicit material;",
  "depicts or promotes violence, self-harm, or graphic content;",
  "is fraudulent, a scam, spam, or misleading, or attempts to obtain money or personal information dishonestly;",
  "offers counterfeit, stolen, illegal, or otherwise prohibited items or services;",
  "infringes the intellectual property, privacy, or other rights of any third party; or",
  "is otherwise unlawful or objectionable.",
];

export default function TermsOfUseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="Terms of Use" onBack={() => router.back()} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <Text className="font-bold text-2xl tracking-tighter mb-4 text-text-primary">
            Terms of Use
          </Text>
          <Text className="text-xs uppercase tracking-widest mb-8 text-text-secondary">
            Last Updated: October 15, 2026
          </Text>

          <Text className="text-sm leading-6 mb-8 text-text-primary">
            These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and Markt Commerce, concerning your access to and use of the Services.
          </Text>

          <Section title="1. AGREEMENT TO OUR LEGAL TERMS">
            <Body>
              We operate the website https://marktcommerce.com (the 'Site'), the mobile application Markt Commerce (the 'App'), as well as any other related products and services that refer or link to these legal terms (the 'Legal Terms').
            </Body>
          </Section>

          <Section title="2. INTELLECTUAL PROPERTY RIGHTS">
            <Body>
              We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the 'Content'), as well as the trademarks, service marks, and logos contained therein (the 'Marks').
            </Body>
          </Section>

          <Section title="3. USER REPRESENTATIONS">
            <Body>
              By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not under the age of 13.
            </Body>
          </Section>

          <Section title="4. PROHIBITED ACTIVITIES">
            <Body>
              You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavours except those that are specifically endorsed or approved by us.
            </Body>
          </Section>

          <Section title="5. USER GENERATED CONTRIBUTIONS">
            <Body>
              The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including posts, product listings, comments, requests, profile information, images, and chat messages ("Contributions"). You are solely responsible for your Contributions.
            </Body>
          </Section>

          <Section title="6. ZERO TOLERANCE FOR OBJECTIONABLE CONTENT AND ABUSIVE USERS">
            <Body className="mb-4">
              <Bold>Markt Commerce has zero tolerance for objectionable content and abusive users.</Bold> By using the Services, you agree that you will not post, list, send, or otherwise make available any Contribution that:
            </Body>
            {PROHIBITED_CONTRIBUTIONS.map((item) => (
              <View key={item} className="flex-row pl-2 mb-2">
                <Body>{"•  "}</Body>
                <Body className="flex-1">{item}</Body>
              </View>
            ))}
            <Body className="mt-2">
              You also agree not to impersonate others, evade a suspension or ban, or use the Services to abuse other users in any way.
            </Body>
          </Section>

          <Section title="7. REPORTING AND BLOCKING">
            <Body>
              Any user can report a post, product, comment, message, or account they believe breaks these Legal Terms by using the <Bold>Report</Bold> option in the App. Any user can also <Bold>block</Bold> another user. Blocking removes that user's content from your feed immediately, prevents them from messaging you, and notifies us so we can review their content. You can manage blocked accounts in the App's settings.
            </Body>
          </Section>

          <Section title="8. MODERATION AND ENFORCEMENT">
            <Body>
              We filter content for objectionable material and review every report we receive. We act on reports of objectionable content within <Bold>24 hours</Bold> by removing the offending content and suspending or permanently removing (ejecting) the user who provided it. We may remove any Contribution and suspend or terminate any account at any time, without notice, if we believe it violates these Legal Terms or puts other users at risk.
            </Body>
          </Section>

          <Section title="9. MOBILE APPLICATION LICENCE">
            <Body>
              If you access the Services via the App, then we grant you a revocable, non-exclusive, non-transferable, limited right to install and use the App on wireless electronic devices owned or controlled by you.
            </Body>
          </Section>

          <Section title="10. TERM AND TERMINATION">
            <Body>
              These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES.
            </Body>
          </Section>

          <Section title="11. GOVERNING LAW">
            <Body>
              These Legal Terms shall be governed by and defined following the laws of Nigeria. Markt Commerce and yourself irrevocably consent that the courts of Nigeria shall have exclusive jurisdiction to resolve any dispute.
            </Body>
          </Section>

          <Section title="12. CONTACT US" last>
            <Body>
              In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at support@marktcommerce.com.
            </Body>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
