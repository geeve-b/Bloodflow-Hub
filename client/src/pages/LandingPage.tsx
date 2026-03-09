import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import generatedImage from "@assets/generated_images/abstract_medical_background_with_soft_red_and_white_tones.png";
import { Heart, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

// Function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Function to check if URL is a video file
const isVideoFile = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

export default function LandingPage() {
  const [videoLink, setVideoLink] = useState<string>("https://youtu.be/iGEgDkIt65M?si=iFk8Toun2iUJqBA9");
  
  const youtubeId = videoLink ? getYouTubeVideoId(videoLink) : null;
  const isVideo = videoLink ? isVideoFile(videoLink) : false;

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
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted" />
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

      {/* Advantages of Blood Donation */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Advantages of Blood Donation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Giving blood is not just about saving others. It also brings health benefits to you as a donor.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Advantages List */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-lg bg-card border border-border p-6 space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">🏥</div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">Free Mini Health Checkup</h3>
                    <p className="text-muted-foreground">
                      Blood pressure and hemoglobin level testing included with every donation.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-lg bg-card border border-border p-6 space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">✔️</div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">Reduces Excess Iron</h3>
                    <p className="text-muted-foreground">
                      Helps reduce excess iron in your body, preventing iron overload-related conditions.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-lg bg-card border border-border p-6 space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">✔️</div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">Stimulates Blood Cell Production</h3>
                    <p className="text-muted-foreground">
                      Your body responds by producing new blood cells, keeping your blood system healthy and strong.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-lg bg-card border border-border p-6 space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">❤️</div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">Reduces Heart-Related Risks</h3>
                    <p className="text-muted-foreground">
                      Regular safe donations may reduce the risk of heart-related issues and improve cardiovascular health.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Side - Video Space */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl bg-secondary/30 border border-border overflow-hidden shadow-lg flex items-center justify-center min-h-[500px]"
            >
              {youtubeId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Blood Donation Benefits Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-xl"
                />
              ) : isVideo ? (
                <video
                  width="100%"
                  height="100%"
                  controls
                  className="rounded-xl"
                >
                  <source src={videoLink} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="text-6xl">🎬</div>
                  <h3 className="text-xl font-bold text-foreground">Video Coming Soon</h3>
                  <p className="text-muted-foreground max-w-xs mb-4">
                    Watch our educational video about the benefits and importance of blood donation.
                  </p>
                  <div className="w-full max-w-md space-y-2">
                    <input
                      type="text"
                      placeholder="Paste YouTube link or video URL here..."
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
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
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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
