export function renderUiModel(model, options) {
  const { fields, formAttrs } = model;
  if (!Array.isArray(fields) || fields.length === 0) {
    const empty = document.createElement("div");
    empty.className = "yamd-ui yamd-ui--empty";
    empty.textContent = "Empty UI block";
    return empty;
  }

  const useForm = hasFormSemantics(fields, formAttrs);
  const el = useForm
    ? document.createElement("form")
    : document.createElement("div");
  const fa = formAttrs && typeof formAttrs === "object" ? formAttrs : {};
  const base = "yamd-ui" + (useForm ? " yamd-ui--form" : " yamd-ui--panel");
  const extra = typeof fa.class === "string" && fa.class.trim() ? " " + fa.class.trim() : "";
  el.className = base + extra;

  if (useForm && el instanceof HTMLFormElement) {
    if (options && options.action) {
      el.action = String(options.action);
    } else if (typeof fa.action === "string" && fa.action) {
      el.action = fa.action;
    }
    const m = (options && options.method) || fa.method || "get";
    el.method = String(m).toLowerCase() === "post" ? "post" : "get";
    if (fa.id != null) {
      el.id = String(fa.id);
    }
    if (fa.name != null) {
      el.setAttribute("name", String(fa.name));
    }
    if (fa.enctype != null) {
      el.enctype = String(fa.enctype);
    }
    if (fa.target != null) {
      el.target = String(fa.target);
    }
    if (fa.autocomplete != null) {
      el.setAttribute("autocomplete", String(fa.autocomplete));
    }
    if (fa.novalidate !== false) {
      el.setAttribute("novalidate", "");
    }
  }

  const stack = document.createElement("div");
  stack.className = "yamd-ui__stack";
  for (const field of fields) {
    stack.appendChild(renderField(field, useForm));
  }
  el.appendChild(stack);
  return el;
}

function hasFormSemantics(fields, formAttrs) {
  if (formAttrs && typeof formAttrs === "object") {
    if (formAttrs.type === "form" || "action" in formAttrs || "method" in formAttrs) {
      return true;
    }
  }
  return fields.some(
    (f) =>
      f &&
      f.type &&
      f.type !== "submit" &&
      f.type !== "button" &&
      f.type !== "static"
  );
}

const LEAF = new Set([
  "input",
  "textArea",
  "checkbox",
  "radio",
  "select",
  "button",
  "submit",
  "static",
]);

function isLeafType(t) {
  return t != null && LEAF.has(String(t));
}

function getChildList(field) {
  if (Array.isArray(field.items)) {
    return field.items;
  }
  if (Array.isArray(field.children)) {
    return field.children;
  }
  if (field.type === "form" && Array.isArray(field.form)) {
    return field.form;
  }
  return null;
}

function renderField(field, inForm) {
  if (!field) {
    return document.createElement("div");
  }
  const kids = getChildList(field);

  if (!isLeafType(field.type) && field.type === "form" && kids) {
    const fs = document.createElement("fieldset");
    fs.className = fieldClass(field, "yamd-form-nested");
    if (field.id) {
      fs.id = String(field.id);
    }
    if (field.name != null) {
      fs.setAttribute("name", String(field.name));
    }
    if (field.action != null) {
      fs.setAttribute("data-form-action", String(field.action));
    }
    if (field.method != null) {
      fs.setAttribute("data-form-method", String(field.method).toLowerCase());
    }
    if (field.title) {
      const leg = document.createElement("legend");
      leg.className = "yamd-form-nested__legend";
      leg.textContent = String(field.title);
      fs.appendChild(leg);
    }
    for (const c of kids) {
      fs.appendChild(renderField(c, inForm));
    }
    return fs;
  }

  if (field.type === "children" && kids) {
    const group = document.createElement("div");
    group.className = fieldClass(field, "yamd-group");
    for (const c of kids) {
      group.appendChild(renderField(c, inForm));
    }
    return group;
  }

  if (kids && field.type !== "form" && field.type !== "children" && !isLeafType(field.type)) {
    const group = document.createElement("fieldset");
    group.className = fieldClass(field, "yamd-fieldset");
    if (field.title) {
      const cap = document.createElement("legend");
      cap.className = "yamd-fieldset__legend";
      cap.textContent = String(field.title);
      group.appendChild(cap);
    }
    for (const c of kids) {
      group.appendChild(renderField(c, inForm));
    }
    return group;
  }

  if (field.type == null) {
    return document.createElement("div");
  }

  switch (field.type) {
    case "textArea": {
      return buildControl(field, "textarea", inForm);
    }
    case "input":
    case "checkbox":
    case "radio":
    case "select": {
      return buildControl(field, field.type, inForm);
    }
    case "submit":
    case "button": {
      const row = document.createElement("div");
      row.className = "yamd-control yamd-control--button";
      const b = document.createElement("button");
      b.type = field.type === "button" ? "button" : "submit";
      b.className = fieldClass(field, "yamd-btn");
      b.textContent = String(field.label || field.title || "Submit");
      if (field.name) {
        b.name = field.name;
      }
      if (field.value != null) {
        b.value = String(field.value);
      }
      row.appendChild(b);
      return row;
    }
    default: {
      const p = document.createElement("p");
      p.className = "yamd-unknown";
      p.textContent = `Unknown UI type: ${String(field.type)}`;
      return p;
    }
  }
}

function fieldClass(field, base) {
  const extra = typeof field.class === "string" && field.class.trim() ? " " + field.class.trim() : "";
  return base + extra;
}

function buildControl(field, kind, inForm) {
  const row = document.createElement("div");
  row.className = fieldClass(field, "yamd-control yamd-control--" + kind);
  if (field.variant) {
    row.setAttribute("data-variant", String(field.variant));
  }

  const id = field.id || (field.name ? "yamd-" + field.name : "");
  if (field.title && (kind === "input" || kind === "textarea" || kind === "select")) {
    const lab = document.createElement("label");
    lab.className = "yamd-control__label";
    if (id) {
      lab.setAttribute("for", id);
    }
    lab.textContent = String(field.title);
    row.appendChild(lab);
  }

  if (kind === "input") {
    const input = document.createElement("input");
    if (id) {
      input.id = id;
    }
    if (field.name) {
      input.name = field.name;
    }
    const variant = String(field.variant || "text");
    if (variant === "email" || variant === "password" || variant === "url" || variant === "tel" || variant === "number") {
      input.type = variant;
    } else {
      input.type = "text";
    }
    if (field.placeholder) {
      input.placeholder = String(field.placeholder);
    }
    if (field.value != null) {
      input.value = String(field.value);
    }
    applyMandatory(input, field, inForm);
    row.appendChild(input);
  } else if (kind === "textarea") {
    const ta = document.createElement("textarea");
    if (id) {
      ta.id = id;
    }
    if (field.name) {
      ta.name = field.name;
    }
    if (field.placeholder) {
      ta.placeholder = String(field.placeholder);
    }
    if (field.value != null) {
      ta.value = String(field.value);
    }
    applyMandatory(ta, field, inForm);
    row.appendChild(ta);
  } else if (kind === "checkbox") {
    const wrap = document.createElement("label");
    wrap.className = "yamd-control__inline";
    const input = document.createElement("input");
    input.type = "checkbox";
    if (id) {
      input.id = id;
    }
    if (field.name) {
      input.name = field.name;
    }
    input.className = "yamd-checkbox";
    if (field.value) {
      input.value = String(field.value);
    }
    applyMandatory(input, field, inForm);
    wrap.appendChild(input);
    if (field.title) {
      const t = document.createElement("span");
      t.className = "yamd-control__title";
      t.textContent = String(field.title);
      wrap.appendChild(t);
    }
    row.appendChild(wrap);
  } else if (kind === "radio") {
    const wrap = document.createElement("label");
    wrap.className = "yamd-control__inline";
    const input = document.createElement("input");
    input.type = "radio";
    if (id) {
      input.id = id;
    }
    if (field.name) {
      input.name = field.name;
    }
    if (field.value != null) {
      input.value = String(field.value);
    }
    applyMandatory(input, field, inForm);
    wrap.appendChild(input);
    if (field.title) {
      const t = document.createElement("span");
      t.className = "yamd-control__title";
      t.textContent = String(field.title);
      wrap.appendChild(t);
    }
    row.appendChild(wrap);
  } else if (kind === "select") {
    const sel = document.createElement("select");
    if (id) {
      sel.id = id;
    }
    if (field.name) {
      sel.name = field.name;
    }
    if (field.multiple) {
      sel.multiple = true;
    }
    fillOptions(sel, field);
    if (field.value != null) {
      sel.value = String(field.value);
    }
    applyMandatory(sel, field, inForm);
    row.appendChild(sel);
  }

  return row;
}

function fillOptions(el, field) {
  const o = field.options;
  if (!o) {
    return;
  }
  if (Array.isArray(o)) {
    o.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = String(v);
      el.appendChild(opt);
    });
    return;
  }
  for (const k of Object.keys(o)) {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = String(o[k] ?? k);
    el.appendChild(opt);
  }
}

function applyMandatory(el, field, inForm) {
  const m = field.mandatory;
  if (m === true) {
    el.setAttribute("required", "");
  } else if (typeof m === "string" && m.length > 0) {
    el.setAttribute("pattern", m);
    if (inForm) {
      el.setAttribute("data-mandatory", "pattern");
    }
  }
  if (m === true || m === 1) {
    el.setAttribute("aria-required", "true");
  }
}
