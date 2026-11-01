/**
 * Curated academic test cases for CiteCheck AI.
 * Covers all 4 verification outcomes:
 * 1. Supported
 * 2. Partially Supported
 * 3. Not Supported
 * 4. Insufficient Evidence
 */

export const SAMPLE_CASES = [
  {
    id: "supported-sample",
    label: "Case 1: Supported (Faithful Citation)",
    outcome: "Supported",
    domain: "Computer Science & AI",
    claim: "Vaswani et al. (2017) demonstrated that the Transformer architecture relies solely on attention mechanisms to compute input and output representations without utilizing recurrent neural networks or convolutions.",
    citation: "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I. (2017). Attention Is All You Need. Advances in Neural Information Processing Systems (NeurIPS 2017), 30, 5998–6008.",
    sourcePassage: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train."
  },
  {
    id: "partially-supported-sample",
    label: "Case 2: Partially Supported (Overgeneralization)",
    outcome: "Partially Supported",
    domain: "Medicine & Metabolism",
    claim: "Smith et al. (2022) established that 16:8 intermittent fasting extends human lifespan by up to 25% and universally prevents cardiovascular disease across all adult populations.",
    citation: "Smith, R. L., Soeters, M. R., Wüst, R. C., & Schrauwen, P. (2022). Metabolic effects of intermittent fasting: from rodent models to human cohorts. Journal of Endocrinology & Metabolism, 48(3), 210-224.",
    sourcePassage: "In controlled murine trials, time-restricted feeding regimens prolonged median lifespan by 18–24% under specific caloric constraints. However, in our 12-month randomized human pilot study (n=48 healthy adults), intermittent fasting yielded modest improvements in fasting insulin sensitivity and lipid profiles, but showed no statistically significant reduction in long-term cardiovascular mortality markers. Extrapolating lifespan extension observed in rodent models directly to general human populations remains unproven and warrants prolonged longitudinal trials."
  },
  {
    id: "not-supported-sample",
    label: "Case 3: Not Supported (Direct Contradiction)",
    outcome: "Not Supported",
    domain: "Neuroscience & Sleep",
    claim: "Walker and Stickgold (2021) concluded that afternoon caffeine intake enhances slow-wave sleep depth and accelerates rapid eye movement (REM) consolidation in healthy adults.",
    citation: "Walker, M. P., & Stickgold, R. (2021). Chronobiology and the neurochemical mechanisms of restorative sleep. Nature Reviews Neuroscience, 22(4), 215-231.",
    sourcePassage: "Our polysomnographic analyses revealed that administering 200 mg of caffeine six hours prior to habitual bedtime caused significant disruption to sleep architecture. Specifically, participants exhibited a 32% reduction in Stage 3/4 slow-wave sleep duration (p < 0.001) and delayed REM sleep latency by an average of 42 minutes. Rather than facilitating consolidation, late-day adenosine receptor antagonism severely fragmented deep sleep continuity and diminished subjective sleep quality ratings."
  },
  {
    id: "insufficient-evidence-sample",
    label: "Case 4: Insufficient Evidence (Methodological / Irrelevant)",
    outcome: "Insufficient Evidence",
    domain: "Marine Biology & Ecotoxicology",
    claim: "Henderson et al. (2023) proved that ingestion of microplastics causes acute endocrine disruption and reduced reproductive fecundity in pelagic bluefin tuna.",
    citation: "Henderson, K. E., Diaz, M., & Laurent, T. (2023). Methodological frameworks for spectroscopic microplastic identification in pelagic waters. Marine Pollution Bulletin, 189, 114750.",
    sourcePassage: "In this study, we evaluated the fidelity of Fourier-transform infrared spectroscopy (FTIR) versus Raman microscopy in detecting polyethylene polymers under varying salinity gradients. Water sampling was conducted at depths between 10m and 100m in the North Atlantic gyre. We outline a standardized calibration protocol for baseline marine particulate monitoring to assist future biological surveys."
  }
];
