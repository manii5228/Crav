
const app = new Vue({
    el : '#app',
    template : /* html */`
        <div> 
            <Navbar />
            <router-view />
        </div>
    `,
    components : {
        Navbar,
    },
    router,
    store,
})