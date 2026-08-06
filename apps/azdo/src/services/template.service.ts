
export function getCyberdyneMdlcYml(): string {
  return `
  - type: Epic
    title: MLDLC Template
    children:
      - type: Feature
        title: Problem statement
        description: |
              A high level description of the problem that does not impact the design of the solution yet.
              Technical and business users meet to discuss the problem and agree on the problem statement having some idea of possible interventions or levers to pull to solve the problem based on outputs from the model.
        children:
          - type: User Story
            title: Problem statement kick-off
            description: |
              A meeting with technical and business owners to discuss the problem statement and have alignment from inception.
              Involve all required personel to ensure a clear understanding of the problem and the impact of the problem.
            acceptance_criteria: |
              Kick-off meeting with relevant stakeholders,
              agreed-upon problem statement,
              sign off to continue to next steps
              If the problem statement is not agreed upon, and more/other stakeholders need to be included, the process starts again.
            points: 2
            tags: PromoMan-Models
          - type: User Story
            title: Data acquisition
            description: |
              Acquire sample data in order to use for down stream analyses.
              This is a sample of the data that will be used for analysis purposes and not modeling.
              Thus, distributions, outcome times, data volumes, data points and outcome volumes are important.
            acceptance_criteria: Sample data acquired
            points: 3
            tags: PromoMan-Models
          - type: User Story
            title: Data analysis
            description: |
              Analyse the sample data to gain a better understanding of how the data fits into the problem.
              Identify which caveats exist with the data and how does it impact the initial problem statement.
              Determine an understanding of when observations of interest occur and how these are currently being handled.
              Determine the levels of availability of data (staging, production etc)
            acceptance_criteria: |
              Data analysis complete and documented in agreed upon format
            points: 5
            tags: PromoMan-Models

          - type: User Story
            title: Feedback analysis findings
            description: |
              Meeting with the same group of stakeholders that attended the problem statement kick-off meeting to discuss the findings of the data analysis.
              This is to ensure that the problem statement is still valid and that the data analysis did not uncover any new information that would impact the problem statement.
              Any impacts on the problem statement are discussed here and if any changes are required, the problem statement is updated and the process starts again.
            acceptance_criteria: |
              Fascilitate feedback meeting,
              Document agreed upon next steps
              Communicate outcome to the necessary stakeholders and interested parties
            points: 2
            tags: PromoMan-Models

      - type: Feature
        title: Outcome and sample design
        description: |
              How will the outcome (target) be designed and defined and how will the sample be designed?
              These are technical work items that need to be fedback to the relevant parties, ensuring alignment with the problem statement. 
              Clearly outline how the outcome is defined and what sample population will be used to train the model.
              Example: user or wager information level, when does the model predict and how is that included in the sample, etc.
        children:
        - type: User Story
          title: Outcome definition
          description: Clearly define the outcome(s) (target(s))
          acceptance_criteria: Outcome(s) defined and documented
          points: 5
          tags: PromoMan-Models
        - type: User Story
          title: Sample design
          description: Create the sample population to train the model that aligns with the problem statement and actual use of the model in production.
          acceptance_criteria: Sample population acquired
          points: 7
          tags: PromoMan-Models
        - type: User Story
          title: Outcome and sample design sign-off
          description: |
              Walkthrough the outcome definition and sample design.
              Sign-off required from all relevant stakeholders in order to proceed to the next phase.
              Discuss impact on downstream processes and teams, providing a heads-up for any work that might be required from them and not block the development and deployment of the model.
          acceptance_criteria: |
                  Outcome signed off, 
                  Sample population signed off, 
                  Downstream processes and teams identified and next steps agreed upon
          points: 1
          tags: PromoMan-Models

      - type: Feature
        title: Model development
        description: |
          Develop the model using the agreed upon outcome (target) and sample definition.
          Prepare the data and follow model development best practices.
        children:
        - type: User Story
          title: Data preparation
          description: Join all relevant data sources and clean the data
          acceptance_criteria: |
            Cleaned dataset for modelling created
          points: 5
          tags: PromoMan-Models
        - type: User Story
          title: Feature engineering
          description: Create features that will be used in the model
          acceptance_criteria: |
                  Feature engineering completed,
                  Appropriate feature store documentation updated
          points: 7
          tags: PromoMan-Models
        - type: User Story
          title: Evaluation criteria discussed and agreed upon
          description: |
                  Discuss and agree upon the evaluation criteria that will be used to evaluate the model performance.
                  This is to ensure that all relevant parties are aligned on the evaluation criteria and that the model is evaluated on the correct metrics.
          acceptance_criteria: |
                  Evaluation criteria agreed upon and documented
          points: 1
          tags: PromoMan-Models
        - type: User Story
          title: Training and tuning of models, evaluation of results, feature selection and model selection
          description: |
                  Create training, validation and testing sets. 
                  Train and tune various models and evaluate the results. 
                  Perform feature selection and reduce the feature space. 
                  Finally, select the best model based on previous steps.
          acceptance_criteria: Draft model trained
          points: 5
          tags: PromoMan-Models
        - type: User Story
          title: Draft model overview and walk-through
          description: |
            Walkthrough the model selected, highlight the key features and how they impact the model, discuss the model performance and flag any potential issues identified during development or in the final model.
          acceptance_criteria: Sign-off on draft model
          points: 3
          tags: PromoMan-Models
        - type: User Story
          title: Discuss AB testing and simulation
          description: |
                  After a final model has been selected, discuss how the model will be evaluated based on the metrics agreed upon, how those are simulated and how they are designed for AB testing.
          acceptance_criteria: Meeting held and documented
          points: 3
          tags: PromoMan-Models

      - type: Feature
        title: Pre-deployment impact analysis and model sign-off
        description: |
          Simulate production interventions on the development sense, analyse the impact of the model and sign-off on the model if all in order.
        children:
          - type: User Story
            title: Simulate impact
            description: |
              Simulate the impact of the model in production by predicting on the development sample and implementing the same interventions that will be implemented in production. 
              Observe if the metric of interest is impacted and if the model is performing as expected outside of a statistical sense.
            acceptance_criteria: |
              Simulation analysis complete, 
              Analysis insights documented, shared and discussed
            points: 5
            tags: PromoMan-Models
          - type: User Story
            title: Model sign-off
            description: The model is signed off and deemed as final, thus ready for deployment.
            acceptance_criteria: Model signed off
            points: 1
            tags: PromoMan-Models
          - type: User Story
            title: Model documentation
            description: Document the model using the pre-defined template in confluence.
            acceptance_criteria: Documentation created.
            points: 1
            tags: PromoMan-Models

      - type: Feature
        title: Model deployment
        description: |
          Deploy the model using the agreed upon deployment process.
          The model is available for consumption but is not yet in production and is not yet used to make decisions.
        children:
          - type: User Story
            title: Create scoring function
            description: Transform development code into a scoring function that can be used to score new data in production.
            acceptance_criteria: Scoring function created
            points: 2
            tags: PromoMan-Models
          - type: User Story
            title: Test scoring function using unit tests
            description: |
              Evaluate the scoring function using unit tests.
              Ensure that the scoring function is working as expected and producing the same result as observed during development.
            acceptance_criteria: |
              Scoring function unit tests reviewed,
              Tests passing
            points: 2
            tags: PromoMan-Models
          - type: User Story
            title: Register scoring function and model
            description: Register the scoring function and model for consumption.
            acceptance_criteria: Scoring function and model registered
            points: 2
            tags: PromoMan-Models

      - type: Feature
        title: Post-deployment impact analysis
        description: |
              After the model has been deployed, analyse the results of the model by performing AB testing.
              Compare the results to the simulation results.
              This is to ensure that the model is performing as expected in production and that the model is not performing differently in production than in development.
              Determine if the model uplifts the metric of interest and if it is statistically significant.
        children:
          - type: User Story
            title: Design AB test scenario
            description: |
                    Create the AB test scenario that will be used to compare the model results to the simulation results.
                    Allocate the required sample sizes to the test and control groups and monitor the pre-defined metrics of interest.
                    Determine the adequate sample size required, duration the experiment should run for and the cost associated.
            acceptance_criteria: AB test created and actively running
            points: 2
            tags: PromoMan-Models
          - type: User Story
            title: Analyse AB test results
            description: |
                    Analyse the results of the AB test and determine if the model is performing as expected in production.
                    Determine if the model uplifts the metric of interest and if it is statistically significant.
            acceptance_criteria: |
                    Analysis complete,
                    Insights documented, shared and discussed
            points: 5
            tags: PromoMan-Models
          - type: User Story
            title: Enable production scoring
            description: |
                    If and once the AB tests results are satisfactory, enable the model to score in production using the pre-determined percentage of traffic.
            acceptance_criteria: Scoring function and model registered
            points: 1
            tags: PromoMan-Models

      - type: Feature
        title: Monitoring and maintenance
        description: After the model is deployed to production perform adequate monitoring and maintenance
        children:
          - type: User Story
            title: Monitoring metrics defined and reports created
            description: |
              Define the metrics that will be monitored and create the reports that will be used to monitor the model performance. 
              Ensure that the reports are available to the relevant stakeholders and that both the model and its features are being monitored. 
              Setup alerting where required.
            acceptance_criteria: Monitoring reports created and available
            points: 3
            tags: PromoMan-Models
          - type: User Story
            title: Actively monitor and maintain model
            description: |
              Monitor the model and maintain where needed during time in production. 
              Ensure that the model is performing as expected and that the model is not degrading over time. 
              Ensure that the input features are stable and not drifting over time.
            acceptance_criteria: Active monitoring
            points: 1
            tags: PromoMan-Models
  `;
}

export function getGenysisMdlcYml(): string {
  return `
  - type: Feature
    title: Pre-Planning
    tags: MDLC;
    children:
      - type: User Story
        title: Context
        acceptance_criteria: |
          <p>
            <ul>
              <li><b>Identifying the Right Problem:</b> The first step involves accurately identifying and defining the problem that needs to be addressed. This will require a thorough understanding of the issue, its causes, and its impact </li>
              <li><b>Determining the Scope:</b> Once the problem has been identified, the next step is to determine the scope of the project. This includes defining the boundaries of the work required, what it will and will not include, and the expected outcomes </li>
              <li><b>Understanding Stakeholders:</b> A crucial part of this task is understanding who the stakeholders are. This includes identifying who will be affected, who has a vested interest in its outcome, and who will be involved in its implementation.</li>
              <li><b>Identifying Constraints and Risks:</b> This step involves identifying any potential constraints or risks that could impact the work required. This could include budgetary constraints, time constraints, or potential risks that could derail the project.</li>
              <li><b>Informing Design Decisions:</b> The information gathered in the previous steps will be used to inform the design decisions. This could include decisions about the project's structure, the technologies used, or the methods of implementation.</li>
              <li><b>Facilitating Communication:</b> It will be important to facilitate clear and effective communication between all stakeholders. This will ensure that everyone is on the same page and that the project is progressing as planned.</li>
            </ul>
          </p>
        tags: MDLC;Pre-Planning;
  - type: Feature
    title: Planning
    tags: MDLC;
    children:
      - type: User Story
        title: Problem Statement
        acceptance_criteria: |
          <p>
            <ul>
              <li>Key Outputs:</li>
                <ul>
                  <li>Evaluate the existing performance levels.</li>
                  <li>Compare current performance against industry benchmarks.
                </ul>
              <br/>
              <li> Establishing the Objective:</li>
                <ul>
                  <li>Identify essential requirements (Must haves).</li>
                  <li>Determine important but not critical needs (Should haves).</li>
                  <li>Recognize nice-to-have features (Could haves).</li>
                  <li>Acknowledge what is not required (Won't haves).</li>
                </ul>
                <br/>
              <li> Collecting Requirements:</li>
                <ul>
                  <li>Compile and document all necessary requirements.</li>
                  <li>Assign priority to each requirement based on importance and urgency.</li>
                  <li>Confirm that requirements are accurate and meet stakeholder expectations.</li>
                  <li>Take into account any technical limitations that may impact the project.</li>
                </ul>
                <br/>
              <li> Defining Success Metrics:</li>
                <ul>
                  <li>Develop clear and measurable criteria for success to evaluate project outcomes.
                </ul>
                <br/>
              <li> Outlining Use Cases:</li>
                <ul>
                  <li>Provide detailed scenarios that the solution must address.
                </ul>
                <br/>
              <li> Organizing and Planning:</li>
                <ul>
                  <li>Arrange requirements in order of significance and urgency.</li>
                  <li>Break down the project into smaller, manageable tasks.</li>
                  <li>Assess the effort and resources required for each task.</li>
                  <li>Set out a clear timeline with key milestones and deadlines.</li>
                  <li>Identify any interdependencies between tasks that could affect the project flow.</li>
                </ul>
                <br/>
              <li>Risk Assessment:</li>
                <ul>
                  <li>Identify potential risks that could impact the model</li>
                  <li>Evaluate the likelihood and impact of each risk.</li>
                  <li>Develop strategies to mitigate or eliminate risks.</li>
                </ul>
                <br/>
            </ul>
          </p>
        tags: MDLC;Planning;
      - type: User Story
        title: Data Requirements (Input)
        acceptance_criteria: |
          <p>
            <ul>
              <li>Data Sources:</li>
                <ul>
                  <li>Identify all potential sources of data.</li>
                  <li>Consider internal and external data sources.</li>
                  <li>Assess the quality and reliability of each data source.</li>
                  <li>Ensure data sources comply with relevant regulations.</li>
                  <li>Consult with experts in the relevant field for insights.</li>
                </ul>
                <br/>
              <li>Data Acquisition:</li>
                <ul>
                  <li>Secure necessary access rights and permissions for data usage.</li>
                  <li>Implement processes for efficient data extraction.</li>
                  <li>Employ strategies for representative data sampling.</li>
                  <li>Enhance the dataset through augmentation techniques.</li>
                  <li>Perform thorough data labeling and annotation for clarity.</li>
                  <li>Ensure robust data storage and management systems are in place.</li>
                </ul>
            </ul>
          </p>
        tags: MDLC;Planning;
      - type: User Story
        title: Data Requirements (Output)
        acceptance_criteria: |
          <p>
            <ul>
              <li>Destination of Data:</li>
                <ul>
                  <li>Specify the intended final location where data will be stored or utilized.</li>
                  <li>Establish protocols for data access and define permission levels.</li>
                  <li>Implement data encryption measures to ensure security during transmission and storage.</li>
                  <li>Guarantee Quality of Service (QoS) to maintain data integrity and availability.</li>
                </ul>
                <br/>
              <li>Schema for Data Output:</li>
                <ul>
                  <li>Outline necessary data transformations to meet the destination format requirements.</li>
                  <li>Set up validation processes to ensure the accuracy and quality of the output data.</li>
                </ul>
            </ul>
          </p>
        tags: MDLC;Planning;
      - type: User Story
        title: Model Selection
        acceptance_criteria: |
          <p>
            <ul>
              <li> Triggers:</li>
                <ul>
                  <li>Activation by specific events</li>
                  <li>Aggregate data processing</li>
                  <li>Timetable-based initiation</li>
                </ul>
                <br>
              <li> Evaluation Metrics:</li>
                <ul>
                  <li>Sub-3-second processing duration</li>
                  <li>Size of the response data package</li>
                  <li>Level of correctness in predictions</li>
                  <li>Rate of true positive predictions</li>
                  <li>Rate of true positive identifications</li>
                  <li>Harmonic mean of precision and recall</li>
                  <li>True negative rate</li>
                  <li>Performance measure for binary classification</li>
                  <li>Average deviation from the true values</li>
                  <li>Average of the squares of the errors</li>
                  <li>Proportion of the variance for a dependent variable</li>
                </ul>
                <br>
              <li> Existing Models Considerations:</li>
                <ul>
                  <li>Overlapping with current models</li>
                  <li>Components that can be repurposed</li>
                  <li>Potential to integrate with or enhance current models</li>
                </ul>
            </ul>
          </p>
        tags: MDLC;Planning;
      - type: User Story
        title: Model Integration
        acceptance_criteria: |
          <p>
            <ul>
              <li>Neuroflow</li>
                <ul>
                  <li>Requirements</li>
                  <li>Unique Model Name</li>
                  <li>Model Description</li>
                  <li>Training of Reaction Engine</li>
                </ul>
                <br>
              <li>Causal</li>
                <ul>
                  <li>Evaluation</li>
                </ul>
                <br>
              <li>Target Performance</li>
                <ul>
                  <li>Model Response time</li>
                  <li>Score values within Range</li>
                </ul>
                <br>
            </ul>
          </p>
        tags: MDLC;Planning;
      - type: User Story
        title: Test Plans
        acceptance_criteria: |
          <p>
            <ul>
              <li>T1</li>
              <br/>
              <li>T2</li>
              <li>T3</li>
                <ul>
                  <li>Define Buffer Requirements</li>
                  <li>Business Logic checks (if any)</li>
                  <li>Test Pack</li>
                  <li>Pipeline</li>
                  <li>Model Output vs Reaction Engine output</li>
                </ul>
                <br>
            </ul>
          </p>
        tags: MDLC;Planning;
      - type: User Story
        title: Monitoring
        acceptance_criteria: |
          <p>
            <ul>
              <li>Define metrics for Monitoring</li>
                <ul>
                  <li>Naming structure</li>
                  <li>Rules</li>
                </ul>
                <br>
              <li>Thresholds & Action Plan</li>
              <br/>
              <li>Define rules and actions</li>
              <br/>
            </ul>
          </p>
        tags: MDLC;Planning;
      - type: User Story
        title: Maintenance
        acceptance_criteria: |
          <p>
            <ul>
              <li>Feedback Questions</li>
                <ul>
                  <li>Create list of Questions that should be asked</li>
                </ul>
                <br>
              <li>Evaluation Metrics</li>
                <ul>
                  <li>List the Metrics that can be compared</li>
                </ul>
                <br>
            </ul>
          </p>
        tags: MDLC;Planning;
  - type: Feature
    title: Model Development
    tags: MDLC;
    children:
      - type: User Story
        title: Data Preprocessing
        acceptance_criteria: |
          <p>
            <ul>
              <li>Criteria for Defining Data Preprocessing:</li>
                <ul>
                  <li>Data Cleaning Criteria:</li>
                    <ul>
                      <li>Detect and address missing data points.</li>
                      <li>Manage statistical outliers.</li>
                      <li>Normalize data formats for consistency.</li>
                      <li>Eliminate duplicate entries.</li>
                      <li>Amend values that are inconsistent or incorrect.</li>
                      <li>Resolve variables that are inconsistent or redundant.</li>
                      <li>Ensure the accuracy and integrity of data.</li>
                      <li>Record the steps taken during the data cleaning process.</li>
                      <li>Conduct tests to confirm the reliability of the cleaned data.</li>
                    </ul>
                    <br>
                  <li>Data Transformation Criteria:</li>
                    <ul>
                      <li>Ascertain the specific data requirements.</li>
                      <li>Process categorical variables appropriately.</li>
                      <li>Keep a detailed record of data transformations.</li>
                      <li>Perform tests to ensure the validity of the transformed data.</li>
                    </ul>
                    <br>
                  <li>Feature Selection Criteria:</li>
                    <ul>
                      <li>Gain a comprehensive understanding of the problem and the data involved.</li>
                      <li>Assess the significance of each feature.</li>
                      <li>Identify and consider the redundancy of features.</li>
                      <li>Apply domain expertise to the selection process.</li>
                      <li>Investigate various feature selection methods.</li>
                      <li>Take into account the interpretability of the model.</li>
                      <li>Measure the effectiveness of the feature selection process.</li>
                      <li>Confirm the appropriateness of the selected features.</li>
                      <li>Continuously refine the feature selection process.</li>
                    </ul>
                    <br>
                  <li>Data Encoding Techniques:</li>
                    <ul>
                      <li>Implement one-hot encoding for nominal categorization.</li>
                      <li>Utilize label encoding for ordinal categorization.</li>
                      <li>Apply ordinal encoding for ordered data.</li>
                      <li>Employ binary encoding for binary categorization.</li>
                      <li>Use count encoding for frequency-based categorization.</li>
                      <li>Adopt target encoding for predictive model features.</li>
                      <li>Utilize feature hashing for high-dimensional data.</li>
                      <li>Explore entity embedding for complex data structures.</li>
                    </ul>
                    <br>
                  <li>Data Splitting Approaches:</li>
                    <ul>
                      <li>Divide data into training, validation, and test sets.</li>
                      <li>Separate data into training and test sets.</li>
                      <li>Implement K-Fold Cross-Validation for model assessment.</li>
                      <li>Use stratified splits to maintain distribution consistency.</li>
                      <li>Apply time series splits for chronological data.</li>
                    </ul>
                    <br>
                  <li>Data Normalization/Scaling Methods:</li>
                    <ul>
                      <li>Scale data using Min-Max normalization.</li>
                      <li>Normalize data with Z-Score methods.</li>
                      <li>Transform data logarithmically for normalization.</li>
                      <li>Employ Box-Cox transformation for data stabilization.</li>
                    </ul>
                    <br>
                  <li>Handling Imbalanced Data Strategies:</li>
                    <ul>
                      <li>Apply resampling techniques to balance datasets.</li>
                      <li>Increase the representation of minority classes through oversampling.</li>
                      <li>Reduce the representation of majority classes through undersampling.</li>
                      <li>Adjust class weights within learning algorithms.</li>
                      <li>Combine multiple models with ensemble methods.</li>
                      <li>Detect outliers or anomalies to improve data balance.</li>
                      <li>Implement cost-sensitive learning to focus on minority classes.</li>
                      <li>Augment the dataset with additional data when possible.</li>
                    </ul>
                    <br>
                  <li>Dimensionality Reduction Techniques:</li>
                    <ul>
                      <li>Utilize Principal Component Analysis (PCA) for feature extraction.</li>
                      <li>Apply Linear Discriminant Analysis (LDA) for maximizing class separation.</li>
                      <li>Employ t-Distributed Stochastic Neighbor Embedding (t-SNE) for high-dimensional data visualization.</li>
                      <li>Explore autoencoders for unsupervised dimensionality reduction.</li>
                    </ul>
                    <br>
                </ul>
            </ul>
          </p>
        tags: MDLC;Model-Development;
      - type: User Story
        title: Model Selection
        acceptance_criteria: |
          <p>
            <ul>
              <li>When establishing criteria for Model Selection, consider the following:</li>
                <ul>
                  <li>Investigate a variety of models:</li>
                    <ul>
                      <li>Employ Linear Regression for relationships that are expected to be linear.</li>
                      <li>Utilize Logistic Regression for binary outcome predictions.</li>
                      <li>Implement Decision Trees to model decisions and their possible consequences.</li>
                      <li>Apply Random Forests for improved predictive accuracy through ensemble learning.</li>
                      <li>Use Support Vector Machines (SVM) for classification and regression tasks.</li>
                      <li>Adopt Naive Bayes for probabilistic classifiers with strong independence assumptions.</li>
                      <li>Integrate Neural Networks for complex patterns and prediction problems.</li>
                      <li>Leverage Gradient Boosting Machines (GBM) for robust predictive models.</li>
                      <li>Opt for K-Nearest Neighbours (KNN) for classification based on closest feature space.</li>
                      <li>Explore Clustering Models for identifying groups in the data.</li>
                    </ul>
                    <br>
                  <li>Account for model complexity:</li>
                    <ul>
                      <li>Guard against Underfitting to ensure the model captures the underlying trends.</li>
                      <li>Beware of Overfitting to prevent the model from capturing noise as a pattern.</li>
                      <li>Balance the Bias-Variance Trade-off for a model that generalizes well to new data.</li>
                      <li>Apply Occam's Razor to favor simpler models that adequately explain the data.</li>
                      <li>Incorporate Regularization to penalize model complexity and prevent overfitting.</li>
                      <li>Prioritize Model Interpretability for models that are understandable and explainable.</li>
                    </ul>
                    <br>
                  <li>Training phase:</li>
                    <ul>
                      <li>Begin with Model initialization to set up the structure and initial parameters.</li>
                      <li>Conduct Forward propagation to apply weights and biases to the input data.</li>
                      <li>Compute Loss calculation to measure the model's prediction error.</li>
                      <li>Perform Backward propagation to adjust the model's weights based on the error.</li>
                      <li>Update parameters to refine the model's predictive ability.</li>
                    </ul>
                    <br>
                  <li>Model evaluation:</li>
                    <ul>
                      <li>Calculate evaluation metrics to quantify the model's performance.</li>
                      <li>Analyze results to understand the model's effectiveness and limitations.</li>
                    </ul>
                    <br>
                  <li>Model performance comparison:</li>
                    <ul>
                      <li>Assess Statistical significance to ensure model improvements are not due to chance.</li>
                      <li>Visualize results to identify patterns and insights in model performance.</li>
                      <li>Evaluate complexity to ensure the model is as simple as possible but no simpler.</li>
                      <li>Consider Ensemble methods to combine multiple models for improved performance.</li>
                    </ul>
                    <br>
                  <li>Hyperparameter tuning:</li>
                    <ul>
                      <li>Define hyperparameters that control the learning process.</li>
                      <li>Establish a search space to explore a range of hyperparameter values.</li>
                      <li>Select an optimization strategy to find the best hyperparameters.</li>
                      <li>Determine an evaluation metric to measure hyperparameter performance.</li>
                      <li>Execute a hyperparameter search to optimize model settings.</li>
                      <li>Analyze results to assess the impact of different hyperparameters.</li>
                      <li>Refine search to narrow down to the most effective hyperparameters.</li>
                    </ul>
                    <br>
                </ul>
            </ul>
          </p>
        tags: MDLC;Model-Development;
      - type: User Story
        title: Model Serialization
        acceptance_criteria: |
          <p>
            <ul>
              <li>Establishing Criteria for Model Serialization:</li>
                <ul>
                  <li>Selecting a Serialization Format:</li>
                    <ul>
                      <li>Utilize conventional formats</li>
                      <li>Assess framework capabilities</li>
                      <li>Evaluate performance metrics</li>
                      <li>Consider flexibility and ease of transfer</li>
                      <li>Ensure model compatibility</li>
                      <li>Verify availability of long-term maintenance</li>
                      <li>Examine security measures</li>
                      <li>Review the supporting ecosystem and available tools</li>
                      <li>Guarantee future-proofing of the model</li>
                    </ul>
                    <br>
                  <li>Executing Model Serialization:</li>
                    <ul>
                      <li>Perform the serialization process of the model</li>
                    </ul>
                    <br>
                  <li>Preserving Model Metadata:</li>
                    <ul>
                      <li>Document essential model metadata</li>
                    </ul>
                    <br>
                  <li>Archiving the Serialized Model:</li>
                    <ul>
                      <li>Securely store the serialized model data</li>
                    </ul>
                    <br>
                  <li>Validating Model Restoration:</li>
                    <ul>
                      <li>Conduct tests to confirm the model's loadability</li>
                    </ul>
                    <br>
                </ul>
            </ul>
          </p>
        tags: MDLC;Model-Development;
  - type: Feature
    title: Model Deployment & Integration
    tags: MDLC;
    children:
      - type: User Story
        title: Integration
        acceptance_criteria: |
          <p>
            <ul>
              <li>Choose the integration approach</li>
              <li>Prepare the deployment environment</li>
              <li>Load the serialized model</li>
              <li>Input data preprocessing</li>
              <li>Define input and output interfaces</li>
              <li>Integrate with application or system</li>
              <li>Implement error handling and logging</li>
              <li>Test integration</li>
              <li>Performance optimization</li>
            </ul>
          </p>
        tags: MDLC;Model-Deployment-Integration;
      - type: User Story
        title: Deployment
        acceptance_criteria: |
          <p>
            <ul>
              <li>Neuroflow</li>
              <li>Causal Impact</li>
              <li>Testing</li>
              <li>Performance Evaluation</li>
              <li>Metric Evaluation</li>
              <li>Launch Darkly</li>
            </ul>
          </p>
        tags: MDLC;Model-Deployment-Integration;
  - type: Feature
    title: Monitoring & Maintenance
    tags: MDLC;
    children:
      - type: User Story
        title: Monitoring
        acceptance_criteria: |
          <p>
            <ul>
              <li>Criteria for Defining Monitoring:</li>
                <ul>
                  <li>Establishing Monitoring Infrastructure:</li>
                    <ul>
                      <li>Develop a centralized monitoring dashboard</li>
                      <li>Implement robust logging and auditing systems</li>
                      <li>Ensure scalability and optimal performance</li>
                      <li>Maintain comprehensive documentation and regular maintenance</li>
                    </ul>
                    <br>
                  <li>Gathering Real-Time Data:</li>
                    <ul>
                      <li>Pinpoint and integrate relevant data sources</li>
                      <li>Architect a well-structured data pipeline</li>
                      <li>Employ effective data collection mechanisms</li>
                      <li>Uphold data quality and implement validation processes</li>
                      <li>Organize data storage solutions and define retention policies</li>
                      <li>Safeguard data security and ensure privacy measures</li>
                      <li>Manage data versioning and maintain lineage records</li>
                      <li>Adhere to data governance standards and regulatory compliance</li>
                      <li>Keep detailed documentation and maintenance schedules</li>
                    </ul>
                    <br>
                  <li>Metrics Analysis and Visualization:</li>
                    <ul>
                      <li>Conduct trend and segment analysis</li>
                      <li>Perform correlation and comparative studies</li>
                      <li>Create dynamic and interactive visualizations</li>
                    </ul>
                    <br>
                  <li>Configuring Thresholds and Alerts:</li>
                    <ul>
                      <li>Establish clear threshold definitions</li>
                      <li>Balance trade-offs effectively</li>
                      <li>Formulate precise alerting rules</li>
                      <li>Determine the granularity of alerts</li>
                      <li>Designate alerting systems and protocols</li>
                      <li>Assign alert security levels and categories</li>
                      <li>Develop alert escalation and resolution procedures</li>
                      <li>Validate alert systems through rigorous testing</li>
                      <li>Foster a culture of continuous improvement</li>
                      <li>Document all processes thoroughly</li>
                    </ul>
                    <br>
                  <li>Anomaly Detection Implementation:</li>
                    <ul>
                      <li>Characterize standard operational behavior</li>
                      <li>Select appropriate anomaly detection methodologies</li>
                    </ul>
                    <br>
                  <li>Diagnosing and Resolving Issues:</li>
                    <ul>
                      <li>Set a baseline for regular monitoring activities</li>
                      <li>Identify critical Key Performance Indicators (KPIs)</li>
                      <li>Integrate extensive logging capabilities</li>
                      <li>Monitor and assure data quality</li>
                      <li>Evaluate model performance consistently</li>
                      <li>Analyze outputs from various models</li>
                    </ul>
                    <br>
                  <li>Executing Corrective Measures:</li>
                    <ul>
                      <li>Perform in-depth root cause analysis</li>
                      <li>Prioritize issues and manage triage processes</li>
                      <li>Outline specific corrective measures</li>
                      <li>Conduct tests and validate outcomes</li>
                      <li>Execute necessary changes efficiently</li>
                      <li>Monitor outcomes and assess impact</li>
                      <li>Document actions and communicate effectively</li>
                      <li>Automate corrective processes where possible</li>
                      <li>Build and maintain effective feedback loops</li>
                    </ul>
                    <br>
                </ul>
            </ul>
          </p>
        tags: MDLC;Monitoring-Maintenance;
      - type: User Story
        title: Maintenance
        acceptance_criteria: |
          <p>
            <ul>
              <li>Establishing Maintenance Criteria:</li>
              <li>Feedback Collection Process:</li>
                <ul>
                  <li>Establish channels for receiving feedback.</li>
                  <li>Engage actively with end-users.</li>
                  <li>Keep track of user interactions.</li>
                  <li>Gather insights from subject matter experts.</li>
                  <li>Work in partnership with all relevant stakeholders.</li>
                  <li>Conduct user interviews and organize focus groups for in-depth understanding.</li>
                </ul>
                <br>
              <li>Feedback Analysis Procedure:</li>
                <ul>
                  <li>Categorize and systematize all received feedback.</li>
                  <li>Perform quantitative assessments of feedback data.</li>
                  <li>Undertake qualitative evaluations to understand user sentiments.</li>
                  <li>Utilize data visualization tools for clearer insight representation.</li>
                  <li>Pinpoint critical areas needing attention.</li>
                  <li>Compare feedback with existing performance metrics.</li>
                  <li>Detect recurring patterns and emerging trends within the feedback.</li>
                  <li>Facilitate stakeholder collaboration for comprehensive analysis.</li>
                </ul>
                <br>
              <li>Model Retraining Guidelines:</li>
                <ul>
                  <li>Set forth clear criteria for when model retraining is necessary.</li>
                  <li>Continuously monitor the performance of the model.</li>
                  <li>Define a schedule for regular model retraining.</li>
                  <li>Develop a systematic retraining pipeline.</li>
                  <li>Formulate a strategic approach for model retraining.</li>
                </ul>
                <br>
              <li>Evaluation and Validation Standards:</li>
                <ul>
                  <li>Implement rigorous testing procedures to evaluate model accuracy.</li>
                  <li>Validate model performance against predefined benchmarks.</li>
                </ul>
                <br>
              <li>Deployment and Testing Protocols:</li>
                <ul>
                  <li>Outline the process for deploying updated models.</li>
                  <li>Conduct thorough testing to ensure model reliability post-deployment.</li>
                </ul>
                <br>
              <li>A/B Testing Framework:</li>
                <ul>
                  <li>Clarify the primary goal of A/B testing.</li>
                  <li>Determine the different variants for testing.</li>
                  <li>Assign participants randomly to different test groups.</li>
                  <li>Calculate the necessary sample size for significant results.</li>
                  <li>Track data meticulously during the testing phase.</li>
                  <li>Apply statistical methods to analyze test results.</li>
                  <li>Make informed decisions based on test interpretations.</li>
                  <li>Perform iterative tests for continuous improvement.</li>
                  <li>Maintain detailed documentation and ensure clear communication of results.</li>
                </ul>
                <br>
              <li>Performance Monitoring System:</li>
                <ul>
                  <li>Establish a system for ongoing monitoring of model performance.</li>
                  <li>Integrate alerts for immediate notification of performance issues.</li>
                </ul>
                <br>
              <li>Continuous Improvement Loop:</li>
                <ul>
                  <li>Create a feedback loop for constant model enhancement based on user input and performance data.</li>
                </ul>
                <br>
              <li>Stakeholder Feedback Integration:</li>
                <ul>
                  <li>Ensure stakeholder feedback is incorporated into maintenance planning and execution.</li>
                </ul>
                <br>
              <li>Maintenance Scheduling:</li>
                <ul>
                  <li>Develop a maintenance schedule that aligns with model performance and user feedback cycles.</li>
                </ul>
                <br>
            </ul>
          </p>
        tags: MDLC;Monitoring-Maintenance;
        children:
      - type: User Story
        title: Documentation & Support
        acceptance_criteria: |
          <p>
            <ul>
              <li>When establishing criteria for Documentation & Support, consider the following comprehensive steps:</li>
                <ul>
                  <li>Outline the model's functionality, detailing its purpose and capabilities.</li>
                  <li>Describe the model's architecture, providing a clear structure and design overview.</li>
                  <li>Specify the model's parameters, including configurations and settings.</li>
                  <li>Record the preprocessing steps, ensuring reproducibility and clarity in data preparation.</li>
                  <li>Chronicle the model's training process, from initial setup to final model selection.</li>
                  <li>Evaluate the model's performance, documenting methods and metrics used for assessment.</li>
                  <li>Detail the deployment process of the model, including integration and launch strategies.</li>
                  <li>List all dependencies and versions to maintain consistency and manage updates.</li>
                  <li>Define input and output specifications for clarity in expected data formats and results.</li>
                  <li>Document the API or inference usage, guiding users on how to interact with the model.</li>
                  <li>Create comprehensive user guides and tutorials for ease of use and better understanding.</li>
                  <li>Discuss the model's limitations and caveats to set realistic expectations.</li>
                  <li>Compile troubleshooting guides and FAQs to assist users in resolving common issues.</li>
                  <li>Establish support channels, providing avenues for help and advice.</li>
                  <li>Regularly update and maintain documentation to reflect changes and improvements.</li>
                  <li>Conduct training and workshops to educate users on the model's features and uses.</li>
                  <li>Actively seek user feedback to continuously improve the documentation and support provided.</li>
                </ul>
            </ul>
          </p>
        tags: MDLC;Monitoring-Maintenance;
  `;
}

export function getChapmansPeakSdlcYml(): string {
  return "";
}
