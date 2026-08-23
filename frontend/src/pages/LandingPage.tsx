import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Activity, Users, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
      <header className="px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-primary">SocietyHub</h1>
        <div className="space-x-4">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/admin/login">
            <Button variant="ghost">Admin Login</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-8 max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Manage your society. <br className="hidden md:block"/>
              <span className="text-primary">Resolve issues faster.</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              SocietyHub gives residents a simple way to report maintenance issues while giving administrators the tools to manage, prioritize and resolve them efficiently.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/register">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full">Raise a Complaint</Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">Admin Login</Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold mb-4">Why SocietyHub?</h3>
              <p className="text-muted-foreground">Everything you need to manage your community effectively.</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<Activity className="w-8 h-8 text-blue-500" />}
                title="Track Every Complaint"
                description="Never lose track of a maintenance request again with our powerful ticketing system."
              />
              <FeatureCard 
                icon={<Users className="w-8 h-8 text-green-500" />}
                title="Transparent Progress"
                description="Residents can see the exact status of their requests in real-time."
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-8 h-8 text-purple-500" />}
                title="Smart Priorities"
                description="Automatically highlight overdue issues and prioritize urgent problems."
              />
              <FeatureCard 
                icon={<BellRing className="w-8 h-8 text-amber-500" />}
                title="Community Updates"
                description="Keep everyone informed with a centralized notice board for important announcements."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-8 text-center text-muted-foreground">
          <p className="mb-4">© 2026 SocietyHub. All rights reserved.</p>
          <p className="text-sm">Make maintenance management effortless.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-900/50">
    <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg inline-block shadow-sm">
      {icon}
    </div>
    <h4 className="text-lg font-semibold mb-2">{title}</h4>
    <p className="text-muted-foreground text-sm">{description}</p>
  </Card>
);
