import { Droplet, Phone, Mail, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export function Footer() {
  const [, navigate] = useLocation();

  return (
    <footer className="bg-secondary/30 border-t border-border mt-auto">
      <div className="w-full px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <h3 className="font-semibold mb-4">Contact Information</h3>
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
        </div>
      </div>
    </footer>
  );
}
