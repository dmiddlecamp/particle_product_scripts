var request = require("request");
var when = require("when");
var pipeline = require("when/pipeline");
var settings = require('./settings.js');

var getListSimsUrl = function(id, token) {
	return "https://api.particle.io/v1/products/"+id+"/sims?access_token="+token;
};
var getUsageUrl = function(product_id, iccid, token) {
	return "https://api.particle.io/v1/products/"+product_id+"/sims/"+iccid+"/data_usage?access_token=" + token;
};

var promiseGetUrl = function(url) {
	var dfd = when.defer();
	request({ uri: url, json: true}, function(err, resp, body) {
		if (err) {
			dfd.reject(err);
		}
		//console.log("body ", body);
		dfd.resolve(body);
	});
	return dfd.promise;
};



pipeline([
	function() {
		var url = getListSimsUrl(settings.product_id, settings.access_token);
		return promiseGetUrl(url);
	},
	function(body) {
		var sims = body.sims;
		var promises = [];
		for(var i=0;i<sims.length;i++) {
			var iccid = sims[i]._id;
			var url = getUsageUrl(settings.product_id, iccid, settings.access_token);
			var promise = promiseGetUrl(url);
			promises.push(promise);
		}

		return when.all(promises);
	},
	function(results) {
		console.log("got back ", results);
		for(var i=0;i<results.length;i++) {
			var usage = results[i];
			for(var d = 0; d<usage.usage_by_day.length;d++) {
				var day = usage.usage_by_day[d];
				console.log("iccid " + usage.iccid, day);
			}
		}
	}
]);
