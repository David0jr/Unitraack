import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse = { x: -1000, y: -1000 };

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                // Adjust for device pixel ratio for sharper rendering
                const dpr = window.devicePixelRatio || 1;
                canvas.width = parent.clientWidth * dpr;
                canvas.height = parent.clientHeight * dpr;
                ctx.scale(dpr, dpr);
                canvas.style.width = `${parent.clientWidth}px`;
                canvas.style.height = `${parent.clientHeight}px`;
                initParticles(parent.clientWidth, parent.clientHeight);
            }
        };

        class Particle {
            x: number;
            y: number;
            baseX: number;
            baseY: number;
            size: number;
            color: string;
            speed: number;
            angle: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.baseX = x;
                this.baseY = y;
                this.size = Math.random() * 2 + 1; // 1 to 3 radius

                // Soft blue/purple colors similar to the antigravity image
                const isPurple = Math.random() > 0.5;
                if (isPurple) {
                    this.color = `rgba(124, 92, 255, ${Math.random() * 0.5 + 0.3})`;
                } else {
                    this.color = `rgba(77, 169, 255, ${Math.random() * 0.5 + 0.2})`;
                }

                this.speed = Math.random() * 0.3 + 0.1;
                this.angle = Math.random() * Math.PI * 2;
            }

            draw(width: number, height: number) {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Gentle drifting when mouse is far away
                this.baseX += Math.cos(this.angle) * this.speed;
                this.baseY += Math.sin(this.angle) * this.speed;

                // Wrap around bounds
                if (this.baseX < 0) this.baseX = width;
                if (this.baseX > width) this.baseX = 0;
                if (this.baseY < 0) this.baseY = height;
                if (this.baseY > height) this.baseY = 0;
            }

            update() {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Mouse repels the points smoothly
                const maxDistance = 120;

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;

                    this.x -= forceDirectionX * force * 5;
                    this.y -= forceDirectionY * force * 5;
                } else {
                    // Return to base position
                    this.x -= (this.x - this.baseX) * 0.05;
                    this.y -= (this.y - this.baseY) * 0.05;
                }
            }
        }

        const initParticles = (width: number, height: number) => {
            particles = [];
            const numParticles = Math.floor((width * height) / 2500); // adjust density
            for (let i = 0; i < numParticles; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                particles.push(new Particle(x, y));
            }
        };

        const animate = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);

            for (let i = 0; i < particles.length; i++) {
                particles[i].draw(parent.clientWidth, parent.clientHeight);
                particles[i].update();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 rounded-l-[2rem] md:rounded-r-none rounded-r-[2rem]"
            style={{ pointerEvents: 'auto' }}
        />
    );
};

export default ParticleBackground;
