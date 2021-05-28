class FrameworkReactive {
  dependencies = new Map();

  constructor(options) {
    this.origin = options.info();

    const self = this;

    this.$data = this.makeProxy(this.origin, self);
  }

  makeProxy(origin, self) {
    return new Proxy(origin, {
      get(target, name) {
        if(Reflect.has(target, name)) {
          self.track(target, name);

          return Reflect.get(target, name)
        };

        console.warn(`La propiedad ${name} no existe`);
        return ''
      },

      set(target, name, value) {
        Reflect.set(target, name, value);

        self.trigger(name);
      }
    });
  }

  mount() {
    this.makeDirectives();
  }

  makeDirectives() {
    this.makeFText();

    this.makeFModel();

    this.makeFBind();
  }

  makeFText() {
    document.querySelectorAll('*[f-text]').forEach(el => {
      const name = el.getAttribute('f-text');
      this.fText(el, this.$data, name);
    });
  }

  makeFModel() {
    document.querySelectorAll('*[f-model]').forEach(el => {
      const name = el.getAttribute('f-model');
      this.fModel(el, this.$data, name);

      el.addEventListener('input', () => {
        Reflect.set(this.$data, name, el.value);
      });
    });
  }

  makeFBind() {
    Array.from(document.querySelectorAll('*'))
    .filter(el => [...el.attributes].some(attr => attr.name.startsWith('f-bind:')))
    .forEach(el => [...el.attributes].forEach(attribute => {
        const name = attribute.value;
        const attr = attribute.name.split(":").pop();

        Reflect.set(el, attr, Reflect.get(this.$data, name));
      })
    );
  }

  track(target, name) {
    if(!this.dependencies.has(name)) {
      const effect = () => {
        document.querySelectorAll(`*[f-text=${name}]`).forEach(el => {
          this.fText(el, target, name);
        });

        document.querySelectorAll(`*[f-model=${name}]`).forEach(el => {
          this.fModel(el, target, name);
        });
      };

      this.dependencies.set(name, effect);
    }
  }

  trigger(name) {
    const effect = this.dependencies.get(name);
    effect();
  }

  fText(el, target, name) {
    el.innerText = Reflect.get(target, name);
  }

  fModel(el, target, name) {
    el.value = Reflect.get(target ,name);
  }
}

const Frameworks = {
  createApp(options) {
    return new FrameworkReactive(options)
  }
}