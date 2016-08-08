module.exports = {
  $inject: function(supply, config){

    var updateConfusion = function(predicted, expected, currentDictionary) {
      // create new confusion dictionary for classes if doesn't exist
      if (Object.keys(currentDictionary).length === 0 && currentDictionary.constructor === Object) {
        currentDictionary = {};
        for(var i in config.parameters.classifications) {
          var currentClass = config.parameters.classifications[i];
          currentDictionary[currentClass] = {tp: 0, tn: 0, fp: 0, fn: 0};
        }
      }

      // update values
      if (predicted == expected) {
        for(var j in currentDictionary) {
          if(j == predicted) { // update tp for correct prediction
            currentDictionary[j].tp++;
          } else { // update tn for correct non-prediction
            currentDictionary[j].tn++;
          }
        }
      } else {
        for(var k in currentDictionary) {
          if(k == predicted) { // i incorrectly marked as prediction
            currentDictionary[k].fn++;
          } else if(k == expected) { // i not identified as expected
            currentDictionary[k].fp++;
          } else { // all others correct
            currentDictionary[k].tn++;
          }
        }
      }

      return currentDictionary;
    };

    var updateAccuracy = function(predicted, expected, accuracyDictionary) {
      // create new accuracy dictionary if doesnt exist
      if (Object.keys(accuracyDictionary).length === 0 && accuracyDictionary.constructor === Object) {
        accuracyDictionary = {correct: 0, incorrect: 0};
      }

      // increment accuracy counters8
      if (predicted == expected) {
        accuracyDictionary.correct++;
      } else {
        accuracyDictionary.incorrect++;
      }

      return accuracyDictionary;
    };

    var confusionDictionary = {};
    var accuracyDictionary = {};

    return {
      confusionDictionary: confusionDictionary,
      accuracyDictionary: accuracyDictionary,
      updateConfusion: updateConfusion,
      updateAccuracy: updateAccuracy
    };
  },
  $main: function($, data, config, callback){
    // update dictionaries with new counts
    $.confusionDictionary = $.updateConfusion(data.predicted,
                                              data.expected,
                                              $.confusionDictionary);
    $.accuracyDictionary = $.updateAccuracy(data.predicted,
                                            data.expected,
                                            $.accuracyDictionary);

    // defining metrics
    function precision(matrix) {
      var numerator = matrix.tp;
      var denominator = matrix.tp + matrix.fp + 0.00000001;

      return numerator / denominator;
    }

    function recall(matrix) {
      var numerator = matrix.tp;
      var denominator = matrix.tp + matrix.fn + 0.00000001;

      return numerator / denominator;
    }

    function f1(precision, recall) {
      return 2 * ((precision * recall) / (precision + recall + 0.00000001));
    }

    // define dictionary builder function
    function classDictionaryBuilder(matrix) {
      var precisionVal = precision(matrix);
      var recallVal    = recall(matrix);
      var f1Val        = f1(precisionVal, recallVal);

      return {
        precision: precisionVal,
        recall: recallVal,
        f1: f1Val
      };
    }

    // create output dictionary
    var output = {};
    var aggPrecision = 0,
        aggRecall    = 0,
        aggF1        = 0;
    var totalInstanceCount = 0;

    for (var i in $.confusionDictionary) {
      var currentInstanceCount = $.confusionDictionary[i].tp + $.confusionDictionary[i].fn;
      totalInstanceCount += currentInstanceCount;

      output[i] = classDictionaryBuilder($.confusionDictionary[i]);
      aggPrecision += output[i].precision * currentInstanceCount;
      aggRecall += output[i].recall * currentInstanceCount;
      aggF1 += output[i].f1 * currentInstanceCount;
    }

    output._aggregatedMetrics = {
      accuracy: $.accuracyDictionary.correct / ($.accuracyDictionary.correct + $.accuracyDictionary.incorrect + 0.00000001),
      precision: aggPrecision / (totalInstanceCount + 0.00000001),
      recall: aggRecall / (totalInstanceCount + 0.00000001),
      f1: aggF1 / (totalInstanceCount + 0.00000001)
    };

    return callback(null, [output]);
  },
  $on: {
    'url-endpoint-name': function($, data, config, callback){
      return callback(null, data);
    }
  }
};