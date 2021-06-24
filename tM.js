
  // Classifier Variable
  let classifier;
  // Model URL
  // let imageModelURL = 'https://teachablemachine.withgoogle.com/models/irTrXMkJX/';
 let imageModelURL = 'https://teachablemachine.withgoogle.com/models/0GrC9d8w1/';
 
  // To store the classification
  let label = "";

  // Get a prediction for the current video frame
  function classifyImage(img) {
    classifier.classify(img, gotResult);
    // console.log( classifier.classify(img, gotResult));
    // return results[0].label;
  }

  // When we get a result
  function gotResult(error, results) {
    // If there is an error
    if (error) {
      console.error(error);
      return;
    }
    // The results are in an array ordered by confidence.
    // console.log(label);
    label = results[0].label;
  }