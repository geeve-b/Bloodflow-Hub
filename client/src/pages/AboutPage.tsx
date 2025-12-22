import { Heart, Users, Target, Lightbulb, TrendingUp, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Geeveswaran B",
      role: "Project Administrator & Developer",
      icon: "👨‍💼",
    },
    {
      name: "Roshan R",
      role: "Server Manager",
      icon: "👨‍💻",
    },
    {
      name: "Bertil Anto",
      role: "Database Manager",
      icon: "🗄️",
    },
    {
      name: "Dakshan Vel",
      role: "Web Developer",
      icon: "🎨",
    },
    {
      name: "Abishek Venkatachalam",
      role: "Project Coordinator",
      icon: "📋",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-8 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-red-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-sm font-semibold text-primary">About Us</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Saving Lives, <span className="text-primary">One Drop at a Time</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We believe every second counts when someone needs blood. Our mission is to bridge the gap between donors,
            recipients, and medical institutions through innovative digital coordination.
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Heart className="h-6 w-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Who We Are</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              LifeFlow is a dedicated team of healthcare enthusiasts, developers, and administrators committed to
              revolutionizing blood donor management. We understand the critical importance of timely blood availability
              in emergency situations, and we've built a platform that makes connecting donors with those in need as
              seamless as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Our Community</h3>
                    <p className="text-muted-foreground">
                      We're building a trusted community where donors, recipients, and medical professionals collaborate
                      to save lives in their area.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Our Innovation</h3>
                    <p className="text-muted-foreground">
                      Through cutting-edge technology and user-centric design, we've created a platform that removes
                      barriers to blood donation and accessibility.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 px-4 md:px-8 bg-red-50/50 dark:bg-red-950/10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h2 className="text-3xl md:text-4xl font-bold">The Challenge</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <Card className="bg-background border-red-200/50 dark:border-red-900/50">
              <CardContent className="pt-6">
                <h3 className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">⏱️</h3>
                <h4 className="font-semibold text-lg mb-2">Time Pressure</h4>
                <p className="text-muted-foreground text-sm">
                  In medical emergencies, finding compatible blood donors quickly is critical and often challenging.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-red-200/50 dark:border-red-900/50">
              <CardContent className="pt-6">
                <h3 className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">🔗</h3>
                <h4 className="font-semibold text-lg mb-2">Disconnected Systems</h4>
                <p className="text-muted-foreground text-sm">
                  Donors, receivers, and blood banks often operate in silos with limited communication channels.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-red-200/50 dark:border-red-900/50">
              <CardContent className="pt-6">
                <h3 className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">📊</h3>
                <h4 className="font-semibold text-lg mb-2">Data Gaps</h4>
                <p className="text-muted-foreground text-sm">
                  Lack of real-time information about blood availability and donor locations creates inefficiencies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Our Solution</h2>
          </div>

          <p className="text-lg text-muted-foreground mb-10">
            LifeFlow connects all stakeholders in the blood donation ecosystem through an intelligent, user-friendly
            platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🩸</span>
              </div>
              <h3 className="text-xl font-semibold">For Donors</h3>
              <p className="text-muted-foreground">
                Register easily, manage your donation history, receive notifications about urgent blood needs in your
                area, and make a tangible difference.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="text-xl font-semibold">For Recipients</h3>
              <p className="text-muted-foreground">
                Find compatible blood types quickly, request blood from our network, track availability in real-time,
                and get the help you need when it matters most.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold">For Blood Banks</h3>
              <p className="text-muted-foreground">
                Manage inventory efficiently, coordinate with donors, fulfill emergency requests, and maintain critical
                blood supplies for their communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-3 mb-4">
                <Award className="h-6 w-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To empower communities through a digital platform that seamlessly connects blood donors with those in
                need, ensuring life-saving blood is always within reach during medical emergencies.
              </p>
            </div>

            <div>
              <div className="inline-flex items-center gap-3 mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold">Our Vision</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A world where no patient dies from a lack of blood availability, where donors feel valued and informed,
                and where blood banks operate with maximum efficiency through intelligent coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Platform Matters */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Why This Platform Matters</h2>

          <div className="space-y-6">
            <Card className="bg-card/50 border-primary/10">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">💚 Saves Lives in Emergencies</h3>
                <p className="text-muted-foreground">
                  Every minute counts in a medical emergency. Our platform reduces the time between request and
                  availability from hours to minutes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/10">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">🤝 Builds Community Resilience</h3>
                <p className="text-muted-foreground">
                  By connecting donors with recipients in their communities, we strengthen social bonds and foster a
                  culture of mutual care and support.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/10">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">📈 Improves Healthcare Infrastructure</h3>
                <p className="text-muted-foreground">
                  Real-time data and coordination help blood banks optimize inventory management and reduce wastage.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/10">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">🌍 Democratizes Access to Blood</h3>
                <p className="text-muted-foreground">
                  Our platform ensures that geography or economic status doesn't determine who gets life-saving blood
                  when they need it most.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 px-4 md:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Our Team</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Dedicated professionals united by a common goal: to make blood donor management efficient, transparent, and
            accessible.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="bg-background border-primary/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{member.icon}</div>
                  <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary text-sm font-medium">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you want to donate, request blood, or learn more about our services, we're here to help.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Become a Donor
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
