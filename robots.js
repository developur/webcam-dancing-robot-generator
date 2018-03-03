


	var d = document,
	canvas2 = d.getElementById("canvas3"),
	context2 = canvas2.getContext("2d"),
	canvas = d.getElementById("canvas"),
	context = canvas.getContext("2d"),
	video = d.getElementById("video"),
	snapshot = d.getElementById("snapshot");
	snapshot.addEventListener("click", takesnapshot, false);	
	campower.addEventListener("click", campowerup, false);
	robotter.addEventListener("click", robotitup, false);

function campowerup() {	
		campower.value = 1;
		snapshot.disabled = false;
		campower.className = campower.className.replace(/\bbtn-default\b/g, "btn-success");
		getusermediadevices();

}

function takesnapshot() {
	snapshot.className = snapshot.className.replace(/\bbtn-default\b/g, "btn-success");
	$("video").hide();
	$("#canvas").show();
	context2.save();
	context2.beginPath();
	context2.arc(100, 100, 100, 0, Math.PI * 2, true);
	context2.closePath();
	context2.clip();
	context2.drawImage(video, 0, 0, 200, 200);
	context2.beginPath();
	context2.arc(0, 0, 25, 0, Math.PI * 2, true);
	context2.clip();
	context2.closePath();
	context2.restore();
}

function getusermediadevices() {
	if (navigator.mediaDevices === undefined) {navigator.mediaDevices = {};}
	if (navigator.mediaDevices.getUserMedia === undefined) {
		navigator.mediaDevices.getUserMedia = function(constraints) {
			var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
			if (!getUserMedia) {
				return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
			} else {
				return new Promise(function(resolve, reject) {
					getUserMedia.call(navigator, constraints, resolve, reject);
				});
			}
		}
	}

	navigator.mediaDevices.getUserMedia({ audio: false, video: true })
	.then(function(stream) {
		var video = document.querySelector('video');
		// Older browsers may not have srcObject
		video.src = window.URL.createObjectURL(stream);
		video.onloadedmetadata = function(e) {
			video.play();
		};
	})
	.catch(function(err) {
		console.log(err.name + ": " + err.message);
	});
	
}


function robotitup() {
robotter.className = robotter.className.replace(/\bbtn-default\b/g, "btn-success");
    var headshot = new Image();
    var dataURL = canvas2.toDataURL();
    headshot.src = dataURL;
    console.log(dataURL);

    var dirvalue = 1;
    {

        class Robot {
            constructor(color, light, size, x, y, face, i, struct) {
                this.x = x;
                this.points = [];
                this.links = [];
                this.frame = 0;
                this.dir = dirvalue;
                this.size = size;
                this.color = Math.round(color);
                this.light = light;
                // ---- create points ----
                for (const p of struct.points) {
                    this.points.push(new Robot.Point(size * p.x + x, size * p.y + y, p.f));
                }
                // ---- create links ----
                for (const link of struct.links) {
                    const p0 = this.points[link.p0];
                    const p1 = this.points[link.p1];
                    const dx = p0.x - p1.x;
                    const dy = p0.y - p1.y;
                    this.links.push(
                        new Robot.Link(
                            this,
                            p0,
                            p1,
                            Math.sqrt(dx * dx + dy * dy),
                            link.size * size / 3,
                            link.lum,
                            link.force,
                            link.disk,
                            i
                        )
                    );
                }
            }
            update() {
                if (++this.frame % 20 === 0) this.dir = -this.dir;
                if (
                    dancerDrag &&
                    this === dancerDrag &&
                    this.size < 16 &&
                    this.frame > 600
                ) {
                    dancerDrag = null;
                    dancers.push(
                        new Robot(
                            this.color,
                            this.light * 1,
                            this.size * 2,
                            pointer.x,
                            pointer.y - 100 * this.size * 2,
                            i,
                            struct
                        )
                    );
                    dancers.sort(function(d0, d1) {
                        return d0.size - d1.size;
                    });
                }
                // ---- update links ----
                for (const link of this.links) {
                    const p0 = link.p0;
                    const p1 = link.p1;
                    const dx = p0.x - p1.x;
                    const dy = p0.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist) {
                        const tw = p0.w + p1.w;
                        const r1 = p1.w / tw;
                        const r0 = p0.w / tw;
                        const dz = (link.distance - dist) * link.force;
                        const sx = dx / dist * dz;
                        const sy = dy / dist * dz;
                        p1.x -= sx * r0;
                        p1.y -= sy * r0;
                        p0.x += sx * r1;
                        p0.y += sy * r1;
                    }
                }
                // ---- update points ----
                for (const point of this.points) {
                    // ---- dragging ----
                    if (this === dancerDrag && point === pointDrag) {
                        point.x += (pointer.x - point.x) * 0.1;
                        point.y += (pointer.y - point.y) * 0.1;
                    }
                    // ---- dance ----
                    if (this !== dancerDrag) {
                        point.fn && point.fn(10 * Math.sqrt(this.size), this.dir);
                    }
                    // ---- verlet integration ----
                    point.vx = point.x - point.px;
                    point.vy = point.y - point.py;
                    point.px = point.x;
                    point.py = point.y;
                    point.vx *= 0.995;
                    point.vy *= 0.995;
                    point.x += point.vx;
                    point.y += point.vy + 0.01;
                }
                // ---- ground ----
                for (const link of this.links) {
                    const p1 = link.p1;
                    if (p1.y > canvas.height * ground - link.size * 0.5) {
                        p1.y = canvas.height * ground - link.size * 0.5;
                        p1.x -= p1.vx;
                        p1.vx = 0;
                        p1.vy = 0;
                    }
                }
                // ---- center position ----
              this.points[3].x += (this.x - this.points[3].x) * 0.001;
            }
            draw() {
                for (const link of this.links) {
                    if (link.size) {
                        const dx = link.p1.x - link.p0.x;
                        const dy = link.p1.y - link.p0.y;
                        const a = Math.atan2(dy, dx);
                        const d = Math.sqrt(dx * dx + dy * dy);
                        // ---- shadow ----
                        ctx.save();
                        ctx.translate(
                            link.p0.x + link.size * 0.25,
                            link.p0.y + link.size * 0.25
                        );
                        ctx.rotate(a);
                        ctx.drawImage(
                            link.shadow, -link.size * 0.5, -link.size * 0.5,
                            d + link.size,
                            link.size
                        );
                        ctx.restore();
                        // ---- stroke ----
                        ctx.save();
                        ctx.translate(link.p0.x, link.p0.y);
                        ctx.rotate(a);
                        ctx.drawImage(
                            link.image, -link.size * 0.5, -link.size * 0.5,
                            d + link.size,
                            link.size
                        );
                        ctx.restore();
                    }
                }
            }
        }

        Robot.Link = class Link {
            constructor(parent, p0, p1, dist, size, light, force, disk, i) {
                // ---- cache strokes ----
                function stroke(color, axis) {

                    var image = [];
                    image[i] = document.createElement("canvas");
									image[i].id = "canvases"+i;
                    image[i].width = (dist + size);
                    image[i].height = size;
                    const ict = image[i].getContext("2d");
                    ict.beginPath();
                    ict.lineCap = "round";
                    ict.lineWidth = size;
                    ict.strokeStyle = color;
                    if (disk) {
                        if (axis) {
                            headshot.addEventListener(
                                "load",
                                function(e) {
                                    ict.drawImage(this, 50, 0,100, 100);
                                },
                                true
                            );
                        } else {}
                    } else {
                        ict.moveTo(size * 0.5, size * 0.5);
                        ict.lineTo(size * 0.5 + dist, size * 0.5);
                        ict.stroke();
                    }
                    if (axis) {
                        const s = size;
                        ict.fillStyle = "rgba(0,0,0,.4)";
                    }
                    return image[i];
                }
                this.p0 = p0;
                this.p1 = p1;
                this.distance = dist;
                this.size = size;
                this.light = light || 10;
                this.force = force || .1;
                this.image = stroke(
                    "hsl(" + parent.color + " ,100%, " + parent.light * this.light + "%)",
                    true
                );
                this.shadow = stroke("rgba(0,0,0,0.4)");
            }
        };
        Robot.Point = class Point {
            constructor(x, y, fn, w) {
                this.x = x;
                this.y = y;
                this.w = w || 0.5;
                this.fn = fn || null;
                this.px = x;
                this.py = y;
                this.vx = 0.0;
                this.vy = 0.0;
            }
        };
        // ---- set canvas ----
        const canvas = {
            init() {
                this.elem = document.getElementById("canvas");
                this.resize();
                window.addEventListener("resize", () => this.resize(), false);
                return this.elem.getContext("2d");
            },
            resize() {
                this.width = this.elem.width = this.elem.offsetWidth;
                this.height = this.elem.height = this.elem.offsetHeight;
                ground = this.height > 500 ? 0.85 : 1.0;
                for (let i = 0; i < dancers.length; i++) {
                    dancers[i].x = (i + 2) * canvas.width / 9;
                }
            }
        };
        // ---- set pointer ----
        const pointer = {
            init(canvas) {
                this.x = 0;
                this.y = 0;
                window.addEventListener("mousemove", e => this.move(e), false);
                canvas.elem.addEventListener("touchmove", e => this.move(e), false);
                window.addEventListener("mousedown", e => this.down(e), false);
                window.addEventListener("touchstart", e => this.down(e), false);
                window.addEventListener("mouseup", e => this.up(e), false);
                window.addEventListener("touchend", e => this.up(e), false);
            },
            down(e) {
                this.move(e);
                for (const dancer of dancers) {
                    for (const point of dancer.points) {
                        const dx = pointer.x - point.x;
                        const dy = pointer.y - point.y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < 60) {
                            dancerDrag = dancer;
                            pointDrag = point;
                            dancer.frame = 0;
                        }
                    }
                }
            },
            up(e) {
                dancerDrag = null;
            },
            move(e) {
                let touchMode = e.targetTouches,
                    pointer;
                if (touchMode) {
                    e.preventDefault();
                    pointer = touchMode[0];
                } else pointer = e;
                this.x = pointer.clientX;
                this.y = pointer.clientY;
            }
        };
        // ---- init ----
        const dancers = [];
        let ground = 0;
        const ctx = canvas.init();
        pointer.init(canvas);
        let dancerDrag = null;
        let pointDrag = null;
        // ---- main loop ----
        const run = () => {
            requestAnimationFrame(run);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, 0);
            ctx.fillRect(0, canvas.height, canvas.width, canvas.height);
            for (const dancer of dancers) {
                dancer.update();
                dancer.draw();
            }
        };
        // ---- robot structure ----
        const struct = {
            points: [{
                x: 0,
                y: -4,
                f(s, d) {
                    this.y -= 0.01 * s;
                }
            },
                {
                    x: 0,
                    y: -16,
                    f(s, d) {
                        this.y -= 0.02 * s * d;
                    }
                },
                {
                    x: 0,
                    y: 12,
                    f(s, d) {
                        this.y += 0.02 * s * d;
                    }
                },
                {
                    x: -12,
                    y: 0
                },
                {
                    x: 12,
                    y: 0
                },
                {
                    x: -3,
                    y: 34,
                    f(s, d) {
                        if (d > 0) {
                            this.x += 0.01 * s;
                            this.y -= 0.015 * s;
                        } else {
                            this.y += 0.02 * s;
                        }
                    }
                },
                {
                    x: 3,
                    y: 34,
                    f(s, d) {
                        if (d > 0) {
                            this.y += 0.02 * s;
                        } else {
                            this.x -= 0.01 * s;
                            this.y -= 0.015 * s;
                        }
                    }
                },
                {
                    x: -28,
                    y: 0,
                    f(s, d) {
                        this.x += this.vx * 0.035;
                        this.y -= 0.001 * s;
                    }
                },
                {
                    x: 28,
                    y: 0,
                    f(s, d) {
                        this.x += this.vx * 0.035;
                        this.y -= 0.001 * s;
                    }
                },
                {
                    x: -3,
                    y: 64,
                    f(s, d) {
                        this.y += 0.015 * s;
                        if (d > 0) {
                            this.y -= 0.01 * s;
                        } else {
                            this.y += 0.05 * s;
                        }
                    }
                },
                {
                    x: 3,
                    y: 64,
                    f(s, d) {
                        this.y += 0.015 * s;
                        if (d > 0) {
                            this.y += 0.05 * s;
                        } else {
                            this.y -= 0.01 * s;
                        }
                    }
                }
            ],
            links: [{
                p0: 3,
                p1: 7,
                size: 12,
                lum: 4
            },
                {
                    p0: 1,
                    p1: 3,
                    size: 14,
                    lum: 10
                },
                {
                    p0: 1,
                    p1: 1,
                    size: 160,
                    lum: 0,
                    disk: 1
                },
                {
                    p0: 5,
                    p1: 9,
                    size: 22,
                    lum: 0.1
                },
                {
                    p0: 2,
                    p1: 5,
                    size:28,
                    lum: 0.1
                },
                {
                    p0: 1,
                    p1: 2,
                    size: 42,
                    lum:1
                },
                {
                    p0: 6,
                    p1: 10,
                    size: 22,
                    lum: .1
                },
                {
                    p0: 2,
                    p1: 6,
                    size: 22,
                    lum: .1
                },
                { p0: 4, p1: 8, size: 12, lum: 10 },
                {
                    p0: 1,
                    p1: 4,
                    size: 12,
                    lum: 4
                }
            ]
        };
			/**	const struct = {
		points: [
			{
				x: 0,
				y: -4,
				f(s, d) {
					this.y -= 0.01 * s;
				}
			},
			{
				x: 0,
				y: -16,
				f(s, d) {
					this.y -= 0.02 * s * d;
				}
			},
			{
				x: 0,
				y: 12,
				f(s, d) {
					this.y += 0.02 * s * d;
				}
			},
			{ x: -12, y: 0 },
			{ x: 12, y: 0 },
			{
				x: -3,
				y: 34,
				f(s, d) {
					if (d > 0) {
						this.x += 0.01 * s;
						this.y -= 0.015 * s;
					} else {
						this.y += 0.02 * s;
					}
				}
			},
			{
				x: 3,
				y: 34,
				f(s, d) {
					if (d > 0) {
						this.y += 0.02 * s;
					} else {
						this.x -= 0.01 * s;
						this.y -= 0.015 * s;
					}
				}
			},
			{
				x: -28,
				y: 0,
				f(s, d) {
					this.x += this.vx * 0.035;
					this.y -= 0.001 * s;
				}
			},
			{
				x: 28,
				y: 0,
				f(s, d) {
					this.x += this.vx * 0.035;
					this.y -= 0.001 * s;
				}
			},
			{
				x: -3,
				y: 64,
				f(s, d) {
					this.y += 0.015 * s;
					if (d > 0) {
						this.y -= 0.01 * s;
					} else {
						this.y += 0.05 * s;
					}
				}
			},
			{
				x: 3,
				y: 64,
				f(s, d) {
					this.y += 0.015 * s;
					if (d > 0) {
						this.y += 0.05 * s;
					} else {
						this.y -= 0.01 * s;
					}
				}
			}
		],
		links: [
			{ p0: 3, p1: 7, size: 12, lum: 0.5 },
			{ p0: 1, p1: 3, size: 24, lum: 0.5 },
			{ p0: 1, p1: 0, size: 60, lum: 0.5, disk: 1 },
			{ p0: 5, p1: 9, size: 16, lum: 0.5 },
			{ p0: 2, p1: 5, size: 32, lum: 0.5 },
			{ p0: 1, p1: 2, size: 50, lum: 1 },
			{ p0: 6, p1: 10, size: 16, lum: 1.5 },
			{ p0: 2, p1: 6, size: 32, lum: 1.5 },
			{ p0: 4, p1: 8, size: 12, lum: 1.5 },
			{ p0: 1, p1: 4, size: 24, lum: 1.5 }
		]
	};
**/
        // ---- instanciate 3obots ----
        for (let i = 0; i < 5; i++) {
            var imgname = "img" + i;
            dancers.push(
                new Robot(
                    i * 360 / 7,
                    33,
                    4,
                    (i + 2) * canvas.width / 8,
                    canvas.height * ground - 300,
                    imgname,
                    i,
                    struct
                )
            );
        }
        run();
    }
}
