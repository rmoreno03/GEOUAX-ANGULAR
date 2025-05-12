import { Component, OnInit, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import Lenis from '@studio-freight/lenis';

// Interfaces definidas para evitar errores de tipo
interface Testimonial {
  quote: string;
  author: string;
  position: string;
  image: string;
}

interface ImpactStat {
  value: number;
  unit: string;
  label: string;
}

interface ReforestationProject {
  name: string;
  trees: number;
  participants: number;
  progress: number;
  image: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  standalone: false,
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit, AfterViewInit {
  currentTestimonialIndex = 0;
  isMenuOpen = false;
  isBackToTopVisible = false;
  lenis: Lenis | null = null;

  testimonials: Testimonial[] = [
    {
      quote: "GeoUAX ha cambiado completamente mi forma de desplazarme por la ciudad. Ahora soy consciente del impacto de cada trayecto y he reducido mi huella de carbono en un 40%.",
      author: "Laura Martínez",
      position: "Estudiante universitaria",
      image: "user1.png"
    },
    {
      quote: "Como ciclista urbano, GeoUAX me ha permitido descubrir rutas más seguras y menos contaminadas. Además, la comunidad es fantástica y muy activa.",
      author: "Carlos Rodríguez",
      position: "Ciclista urbano",
      image: "user2.png"
    },
    {
      quote: "Utilizamos GeoUAX para organizar rutas grupales sostenibles. La función de cálculo de emisiones nos ha permitido reducir nuestro impacto en un 60% en sólo 3 meses.",
      author: "Elena Gómez",
      position: "Coordinadora ambiental",
      image: "user3.png"
    }
  ];

  impactStats: ImpactStat[] = [
    { value: 42680, unit: 'kg', label: 'CO₂ reducido' },
    { value: 1945, unit: '', label: 'Árboles equivalentes' },
    { value: 286540, unit: 'km', label: 'Trayectos sostenibles' },
    { value: 8452, unit: '', label: 'Usuarios comprometidos' }
  ];

  reforestationProjects: ReforestationProject[] = [
    {
      name: 'Reforestación Sierra Norte',
      trees: 850,
      participants: 124,
      progress: 78,
      image: 'reforestacion1.png'
    },
    {
      name: 'Recuperación Bosque Mediterráneo',
      trees: 1250,
      participants: 186,
      progress: 45,
      image: 'reforestacion2.png'
    }
  ];

  features: Feature[] = [
    {
      icon: 'map-marker-alt',
      title: 'Puntos sostenibles',
      description: 'Guarda ubicaciones, imágenes y datos ambientales. Todo se registra en la nube con tecnología Firebase.'
    },
    {
      icon: 'route',
      title: 'Rutas por tipo de transporte',
      description: 'Elige entre a pie, bicicleta o coche. Visualiza el impacto y selecciona la ruta más responsable.'
    },
    {
      icon: 'seedling',
      title: 'Huella de carbono',
      description: 'GeoUAX calcula las emisiones de cada trayecto y te ofrece alternativas para reducirlas.'
    },
    {
      icon: 'award',
      title: 'Retos y logros',
      description: 'Completa retos semanales, sube de nivel y colabora con la comunidad para mejorar el mundo.'
    },
    {
      icon: 'users',
      title: 'Comunidad activa',
      description: 'Comparte tus rutas, interactúa con otros usuarios y participa en eventos sostenibles cercanos.'
    },
    {
      icon: 'chart-line',
      title: 'Estadísticas detalladas',
      description: 'Analiza tu progreso, visualiza tendencias y observa tu impacto ambiental positivo en tiempo real.'
    }
  ];

  constructor(
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initLenis();
    this.setupEventListeners();
    this.initializeObservers();
  }

  private initLenis(): void {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false
    });

    const raf = (time: number) => {
      this.lenis!.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
  }

  private setupEventListeners(): void {
    window.addEventListener('scroll', () => {
      this.isBackToTopVisible = window.scrollY > 300;
    });

    this.el.nativeElement.querySelectorAll('a[href^="#"]').forEach((anchor: HTMLAnchorElement) => {
      anchor.addEventListener('click', (e: Event) => {
        e.preventDefault();
        this.isMenuOpen = false;

        const targetId = anchor.getAttribute('href');
        if (targetId) {
          const targetElement = document.querySelector(targetId);
          if (targetElement && this.lenis) {
            this.lenis.scrollTo(targetElement as HTMLElement);
          }
        }
      });
    });
  }

  private initializeObservers(): void {
    const impactSection = this.el.nativeElement.querySelector('.impact-section');
    if (impactSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounters();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(impactSection);
    }
  }

  scrollToTop(): void {
    this.lenis?.scrollTo(0);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  nextTestimonial(): void {
    this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
  }

  previousTestimonial(): void {
    this.currentTestimonialIndex = (this.currentTestimonialIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  setTestimonial(index: number): void {
    this.currentTestimonialIndex = index;
  }

  private animateCounters(): void {
    const counters = this.el.nativeElement.querySelectorAll('.counter-number');
    let completed = 0;

    counters.forEach((counter: HTMLElement, index: number) => {
      const targetValue = this.impactStats[index].value;
      let currentValue = 0;
      const increment = targetValue / 100;

      const interval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
          currentValue = targetValue;
          clearInterval(interval);
          completed++;
          if (completed === counters.length) {
            this.el.nativeElement.querySelectorAll('.counter-number').forEach((c: HTMLElement, i: number) => {
              c.textContent = this.impactStats[i].value.toLocaleString();
            });
          }
        } else {
          counter.textContent = Math.ceil(currentValue).toString();
        }
      }, 20);
    });
  }
}
