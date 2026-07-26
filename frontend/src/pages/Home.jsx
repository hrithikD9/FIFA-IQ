import React from 'react'
import CTASection from '../components/CTASection'
import FeatureCard from '../components/FeatureCard'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
// import PredictionCard from './components/PredictionCard'

const Home = () => {
    return (
        <div>
            <Navbar />
            <main>
                <Hero />
                <FeatureCard />
                <CTASection />
            </main>
            <Footer />
        </div>
    )
}

export default Home