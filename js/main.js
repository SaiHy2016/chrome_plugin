var cs=function () {
    console.log(...arguments)
}

function findIP(onNewIP) { //  onNewIp - your listener function for new IPs
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; //compatibility for firefox and chrome
    var pc = new myPeerConnection({iceServers: []}), // 空的ICE服务器（STUN或者TURN）
        noop = function() {},
        localIPs = {}, //记录有没有被调用到onNewIP这个listener上
        ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
        key;

    function ipIterate(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
    }
    pc.createDataChannel(""); //create a bogus data channel
    pc.createOffer().then(function(sdp) {
        sdp.sdp.split('\n').forEach(function(line) {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex).forEach(ipIterate);
        });
        pc.setLocalDescription(sdp, noop, noop);
    }); // create offer and set local description
    pc.onicecandidate = function(ice) { //listen for candidate events
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(ipIterate);
    };
}

// Vue.config.devtools = true;

new Vue({
    el:'#app',
    data:{
        navs:['ip-qr','some'],
        name:['二维码','aa'],
        step:0
    },
    template:`<div id="app">
                    <nav style="cursor: pointer">
                        <a v-for="(n,i) in name" 
                        :class="i==step&&'active'"
                        @click="switchNav(i)">{{name[i]}}</a>
                    </nav>
                    <component :is="navs[step]"></component>           
                </div>`,
    mounted:function () {

    },
    methods:{
        switchNav(s){
            this.step=s
        }
    },
    components:{
        'ip-qr':{
            template:`<div>本地ip地址:{{ip}}<br>{{url}}<div ref="qr" style="text-align: center"></div></div>`,
            data(){
                return {
                    ip: '',
                    url: ''
                }
            },
            mounted(){
                findIP(ip=>{
                    this.ip=ip;
                    chrome.tabs.query({
                        active: true
                    }, function(tabArray){
                        console.log(tabArray[0].url)
                        this.url=tabArray[0].url.replace(/:\/\/[^\/]*/,'://'+this.ip);
                        $(this.$refs.qr).qrcode({text:this.url,width:100,height:100})
                    }.bind(this));
                });
            }
        },
        'some':{

        }
    }
})