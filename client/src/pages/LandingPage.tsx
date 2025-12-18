import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import generatedImage from "@assets/generated_images/abstract_medical_background_with_soft_red_and_white_tones.png";
import { Heart, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-20 lg:pt-32 pb-24">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 h-[800px] w-[800px] rounded-full bg-primary/20 blur-[120px] translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="container relative z-10 px-4 md:px-8 max-w-screen-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Urgent Need: O- and B+ Donors
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Your Blood Can <br/>
                <span className="text-primary bg-clip-text">Save a Life Today.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                LifeFlow connects hospitals, donors, and patients in real-time. 
                Find blood instantly or register as a donor to be a hero in someone's story.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    Register as Donor
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    Find Blood
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-slate-200" />
                  ))}
                </div>
                <p>Join <span className="font-bold text-foreground">10,000+</span> donors saving lives.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-border"
            >
              <img 
                src={generatedImage} 
                alt="Medical Professional" 
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8 text-white">
                <p className="font-medium">"Donating blood is the simplest way to impact a life forever."</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/30 border-y border-border">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-background/50 backdrop-blur border-none shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Real-time Search</h3>
                <p className="text-muted-foreground">
                  Check blood availability across all registered hospitals instantly. No more calling around in emergencies.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/50 backdrop-blur border-none shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Verified Donors</h3>
                <p className="text-muted-foreground">
                  All donors undergo strict medical checks and ID verification by hospital staff before approval.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/50 backdrop-blur border-none shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Privacy First</h3>
                <p className="text-muted-foreground">
                  Donor contact details are never public. We handle communication securely via email notifications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
