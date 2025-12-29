import { Droplet, Heart, Phone, Mail, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export function Footer() {
  const [, navigate] = useLocation();

  return (
    <footer className="bg-secondary/30 border-t border-border mt-auto">
      <div className="w-full px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Droplet className="h-5 w-5 text-primary fill-primary" />
              <span className="text-foreground">Life<span className="text-primary">Flow</span></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Connecting donors with those in need. We provide a secure, efficient platform for blood donation and inventory management.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate("/about")} className="hover:text-primary transition-colors cursor-pointer">About Us</button></li>
              <li><button onClick={() => navigate("/")} className="hover:text-primary transition-colors cursor-pointer">Find a Donor</button></li>
              <li><button onClick={() => navigate("/login")} className="hover:text-primary transition-colors cursor-pointer">Hospital Login</button></li>
              <li><button onClick={() => navigate("/contact")} className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>bloodflowhub@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>123 Health Ave, Medical District</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Emergency</h3>
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <p className="text-destructive font-medium text-sm mb-2">Need blood urgently?</p>
              <button className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Request Immediate Help
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LifeFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
