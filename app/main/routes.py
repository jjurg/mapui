from flask import render_template
from app.main import bp

@bp.route('/')
@bp.route('/index')
def index():
    return render_template('pages/map_view.html')

@bp.route('/split-view')
def split_view():
    return render_template('pages/split_view.html')
