<template>
  <div>
      <h1>About CiteLearn</h1>
      <p>CiteLearn is an academic tool for learning to cite sources.</p>
      <p>When university students learn about citation practices, they are effectively being socialised into a particular professional genre with its own institutional contexts and norms (Lea & Street, 2006). A key component of these social norms in academic writing involves a broad set of academic integrity practices of which citation is a key part. But, we often focus on citation only from a plagiarism perspective, rather than their driving purposes for verifiability (McGowan, 2005). Both appropriate paraphrasing, and high quality synthesis writing, are challenging skills to learn but are important for accurate citations and referencing. </p>
      <p>Effective paraphrasing is something all students need support in developing (Keck, 2006) but there are few learning tools to develop citation practices. Previous game based citation tools rely on multiple-choice-quiz (MCQ) assessments largely focusing on issues of plagiarism and academic integrity, and do not directly assess the authentic practices of writing and citing Bradley, 2015).</p>
      <p>The aim of the CiteLearn project is to build  learning tasks for the improvement of information literacy and credibility practices for scalable use across teaching contexts.</p>
      <h3 class="mt-5">Development Team</h3>
      <p>CiteLearn was developed at the University of Technology, Sydney's <a href="https://www.uts.edu.au/about/faculty-transdisciplinary-innovation">Faculty of Transdisciplinary Innovation</a> by Simon Chambers, Simon Knight, Shibani Antonette and Heather Ford.</p>
      <p>The software is made available under the Apache License and is published at <a href="https://github.com/thelondonsimon/citelearn">github.com/thelondonsimon/citelearn</a>
      <h3 class="mt-5">Acknowledgements</h3>
      <b-row>
        <b-col>
          <b-card
            title="WikiCred"
            :img-src="require('../assets/wikicred.png')"
            img-alt="Image"
            img-top
            tag="article"
            class="mb-2"
          >
            <b-card-text>
              CiteLearn was supported by a microgrant from <a href="">WikiCred</a> - an initiative supporting research, software projects and Wikimedia events that explore information reliability and credibility.
            </b-card-text>
            <b-button href="https://www.wikicred.org" variant="primary">WikiCred</b-button>
          </b-card>
        </b-col>
        <b-col>
          <b-card
            title="Citation Needed"
            :img-src="require('../assets/citationneeded.png')"
            img-alt="Image"
            img-top
            class="mb-2"
          >
            <b-card-text>
              The predictions which CiteLearn makes utilise models which were developed by Miriam Redi's team in their work on <a href="https://github.com/mirrys/citation-needed-paper">Citation Needed</a>.
            </b-card-text>
            
            <b-button href="https://github.com/mirrys/citation-needed-paper" variant="primary">Citation Needed</b-button>
          </b-card>
        </b-col>
        <b-col>
          <b-card
          title="Wikimedia Foundation"
            :img-src="require('../assets/wikimediafoundation.png')"
            img-alt="Image"
            img-top
            class="mb-2"
          >
            <b-card-text>
              CiteLearn's hosting infrastructure is supported by the <a href="https://wikimediafoundation.org">Wikimedia Foundation</a>, which provides the essential infrastructure for free knowledge.
            </b-card-text>
            
            <b-button href="https://wikimediafoundation.org" variant="primary">Wikimedia Foundation</b-button>
          </b-card>
        </b-col>
      </b-row>
  </div>
</template>

<script>
export default { name: 'About' }
</script>