'use strict';

exports = module.exports = {

    parseMessages: function(str) {
        var packets = [];
        while(str.length > 0)
        {
            var x = /~m~(\d+)~m~/.exec(str);
            var packet = str.slice(x[0].length, x[0].length + parseInt(x[1]));
            if(packet.substr(0, 3) != '~h~') {
                packets.push(JSON.parse(packet));
            } else
                packets.push({ "~protocol~keepalive~": packet.substr(3) });
    
            str.slice(0, x[0].length);
            str = str.slice(x[0].length + parseInt(x[1]));
        }
        return packets;
    },
    
    prependHeader: function(str) {
        return '~m~' + str.length + '~m~' + str;
    },
    
    createMessage: function(func, param_list) {
        
        function constructMessage(func, param_list)
        {
            return JSON.stringify({
                "m": func,
                "p": param_list
            });
        }
    
        return this.prependHeader(
            constructMessage(func, param_list)
        );
    }

}